import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from 'redis';
import type {
  IdentityRole,
  Player,
  RoleCard,
  RolePools,
  Room,
  Team,
  TreacheryDataCard,
  TreacheryDataFile,
} from './app/features/treachery/treachery.models';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const defaultAllowedHosts = [
  'mtg-play2gether.com',
  'www.mtg-play2gether.com',
  'localhost',
  '127.0.0.1',
];

const envAllowedHosts = process.env['NG_ALLOWED_HOSTS']
  ?.split(',')
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

const angularApp = new AngularNodeAppEngine({
  allowedHosts: envAllowedHosts && envAllowedHosts.length > 0 ? envAllowedHosts : defaultAllowedHosts,
});

interface RoomRepository {
  has(roomCode: string): Promise<boolean>;
  get(roomCode: string): Promise<Room | null>;
  set(room: Room): Promise<void>;
}

interface RedisRoomClient {
  exists(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options: {
      EX: number;
    },
  ): Promise<string | null>;
}

class InMemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, Room>();

  async has(roomCode: string): Promise<boolean> {
    return this.rooms.has(roomCode.toUpperCase());
  }

  async get(roomCode: string): Promise<Room | null> {
    return this.rooms.get(roomCode.toUpperCase()) ?? null;
  }

  async set(room: Room): Promise<void> {
    this.rooms.set(room.code.toUpperCase(), room);
  }
}

class RedisRoomRepository implements RoomRepository {
  private static readonly roomKeyPrefix = 'treachery:room:';

  constructor(
    private readonly client: RedisRoomClient,
    private readonly roomTtlSeconds: number,
  ) {}

  async has(roomCode: string): Promise<boolean> {
    const key = this.makeRoomKey(roomCode);
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async get(roomCode: string): Promise<Room | null> {
    const key = this.makeRoomKey(roomCode);
    const raw = await this.client.get(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Room;
    } catch {
      return null;
    }
  }

  async set(room: Room): Promise<void> {
    const key = this.makeRoomKey(room.code);
    await this.client.set(key, JSON.stringify(room), {
      EX: this.roomTtlSeconds,
    });
  }

  private makeRoomKey(roomCode: string): string {
    return `${RedisRoomRepository.roomKeyPrefix}${roomCode.toUpperCase()}`;
  }
}

const roomRepositoryPromise = initializeRoomRepository();
const rolePoolsByLocale = new Map<string, RolePools>();

const FALLBACK_LEADER_CARDS: Omit<RoleCard, 'role' | 'team'>[] = [
  {
    title: 'Leader of the Alliance',
    objective: 'Stay alive and coordinate with Guardians to defeat enemies.',
    hint: 'You are the key target. Build defenses and identify threats early.',
    rulings: 'The Leader is the primary target for Assassins and Traitors. Guardians must protect the Leader at all costs.',  
  },
];

const FALLBACK_GUARDIAN_CARDS: Omit<RoleCard, 'role' | 'team'>[] = [
  {
    title: 'Guardian of the Realm',
    objective: 'Protect the Leader and help eliminate Assassins and Traitors.',
    hint: 'Track aggressive players and preserve resources for key turns.',
    rulings: 'Guardians must protect the Leader and coordinate with other players to eliminate threats.',
  },
];

const FALLBACK_ASSASSIN_CARDS: Omit<RoleCard, 'role' | 'team'>[] = [
  {
    title: 'Silent Assassin',
    objective: 'Eliminate all Leader players while at least one Assassin survives.',
    hint: 'Pressure the Leader team and disguise your alignment when possible.',
    rulings: 'Assassins must work together to eliminate the Leader and Guardians while avoiding detection.',
  },
];

const FALLBACK_TRAITOR_CARDS: Omit<RoleCard, 'role' | 'team'>[] = [
  {
    title: 'Shadow Schemer',
    objective: 'Outlast every other player, including other Traitors.',
    hint: 'Your role is solo. Keep allies temporary and opportunistic.',
    rulings: 'Traitors must manipulate other players and avoid being eliminated while pursuing their own agenda.',
  },
  {
    title: 'False Ally',
    objective: 'Create chaos and survive until all opponents are gone.',
    hint: 'Offer good advice early, then mislead at key moments.',
    rulings: 'Traitors must sow discord and avoid being the focus of elimination while pursuing their own victory conditions.',
  },
  {
    title: 'Arcane Betrayer',
    objective: 'Break alliances and finish the game as the last standing side.',
    hint: 'Use confident calls and blame variance for bad outcomes.',
    rulings: 'Traitors must sow discord and avoid being the focus of elimination while pursuing their own victory conditions.',
  },
];

function randomCode(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return value;
}

async function getRoomRepository(): Promise<RoomRepository> {
  return roomRepositoryPromise;
}

async function initializeRoomRepository(): Promise<RoomRepository> {
  const redisUrl = process.env['REDIS_URL']?.trim();
  const roomTtlSecondsRaw = Number(process.env['ROOM_TTL_SECONDS'] ?? 86400);
  const roomTtlSeconds = Number.isFinite(roomTtlSecondsRaw) && roomTtlSecondsRaw > 0
    ? Math.floor(roomTtlSecondsRaw)
    : 86400;

  if (!redisUrl) {
    console.log('REDIS_URL is not set. Using in-memory room repository.');
    return new InMemoryRoomRepository();
  }

  const client = createClient({ url: redisUrl });
  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  try {
    await client.connect();
    console.log(`Connected to Redis room repository (TTL ${roomTtlSeconds}s).`);
    return new RedisRoomRepository(client, roomTtlSeconds);
  } catch (error) {
    console.error('Failed to connect to Redis. Falling back to in-memory room repository.', error);
    return new InMemoryRoomRepository();
  }
}

async function createUniqueRoomCode(roomRepository: RoomRepository): Promise<string> {
  let code = randomCode(6);

  while (await roomRepository.has(code)) {
    code = randomCode(6);
  }

  return code;
}

function createPlayerCode(room: Room): string {
  let code = randomCode(8);

  while (room.players.some((player) => player.code === code)) {
    code = randomCode(8);
  }

  return code;
}

function asText(value: unknown, fallback: string): string {
  if (Array.isArray(value)) {
    const cleanedParts = value
      .map((item) => (typeof item === 'string' ? item : ''))
      .map((item) => item.replaceAll('|', '<br>').trim())
      .filter((item) => item.length > 0);

    const cleaned = cleanedParts.join('<br><br>');
    return cleaned.length > 0 ? cleaned : fallback;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const cleaned = value.replaceAll('|', '<br>').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function cardSubtype(card: TreacheryDataCard): string {
  const subtypeFromObject = asText(card.types?.subtype, '');
  if (subtypeFromObject.length > 0) {
    return subtypeFromObject;
  }

  const fullType = asText(card.type, '');
  const typeParts = fullType.split(' - ');
  return typeParts.length > 1 ? typeParts[typeParts.length - 1].trim() : '';
}

function toRoleTemplate(card: TreacheryDataCard): Omit<RoleCard, 'role' | 'team'> {
  const title = asText(card.name, 'Unknown Role Card');
  const objective = asText(card.text, 'No rules text available for this card.');
  const typeText = asText(card.type, 'Identity');
  const colorText = asText(card.color, 'colorless');
  const ruleText = asText(card.rulings, 'No rules text available for this card.');

  return {
    title,
    objective,
    hint: `${typeText} | ${colorText}`,
    rulings: `${ruleText}`,
  };
}

function toRoleTeam(role: IdentityRole): Team {
  if (role === 'LEADER' || role === 'GUARDIAN') {
    return 'LEADER_TEAM';
  }

  if (role === 'ASSASSIN') {
    return 'ASSASSINS_TEAM';
  }

  return 'TRAITOR_TEAM';
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildRolePlan(playerCount: number): IdentityRole[] {
  const assassinCount = Math.floor(playerCount / 2);
  const remainingAfterLeaderAndAssassins = playerCount - 1 - assassinCount;
  const traitorCount = Math.max(1, Math.floor(remainingAfterLeaderAndAssassins / 2));
  const guardianCount = Math.max(0, remainingAfterLeaderAndAssassins - traitorCount);

  const roles: IdentityRole[] = ['LEADER'];

  for (let index = 0; index < guardianCount; index += 1) {
    roles.push('GUARDIAN');
  }

  for (let index = 0; index < assassinCount; index += 1) {
    roles.push('ASSASSIN');
  }

  for (let index = 0; index < traitorCount; index += 1) {
    roles.push('TRAITOR');
  }

  while (roles.length < playerCount) {
    roles.push('GUARDIAN');
  }

  return roles;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }

  return copy;
}

function getRolePools(locale = 'en'): RolePools {
  const normalizedLocale = locale.startsWith('es') ? 'es' : 'en';
  const cached = rolePoolsByLocale.get(normalizedLocale);
  if (cached) {
    return cached;
  }

  const pools = loadRolePools(normalizedLocale);
  rolePoolsByLocale.set(normalizedLocale, pools);
  return pools;
}

function makeCardFromRole(role: IdentityRole, locale = 'en'): RoleCard {
  const rolePools = getRolePools(locale);

  if (role === 'LEADER') {
    const template = pickRandom(rolePools.leader);
    return {
      role,
      team: toRoleTeam(role),
      title: template.title,
      objective: template.objective,
      hint: template.hint,
      rulings: template.rulings,
    };
  }

  if (role === 'GUARDIAN') {
    const template = pickRandom(rolePools.guardian);
    return {
      role,
      team: toRoleTeam(role),
      title: template.title,
      objective: template.objective,
      hint: template.hint,
      rulings: template.rulings,
    };
  }

  if (role === 'ASSASSIN') {
    const template = pickRandom(rolePools.assassin);
    return {
      role,
      team: toRoleTeam(role),
      title: template.title,
      objective: template.objective,
      hint: template.hint,
      rulings: template.rulings,
    };
  }

  const template = pickRandom(rolePools.traitor);
  return {
    role,
    team: toRoleTeam(role),
    title: template.title,
    objective: template.objective,
    hint: template.hint,
    rulings: template.rulings
  };
}

function getPreferredLocale(acceptLanguageHeader?: string | string[]): string {
  const envLocale = process.env['TREACHERY_LOCALE']?.trim().toLowerCase();
  if (envLocale) {
    return envLocale;
  }

  const headerValue = Array.isArray(acceptLanguageHeader)
    ? acceptLanguageHeader[0]
    : acceptLanguageHeader;
  if (headerValue) {
    const preferred = headerValue
      .split(',')
      .map((entry) => entry.trim().split(';')[0].trim().toLowerCase())
      .find((entry) => entry === 'es' || entry.startsWith('es-'));

    if (preferred) {
      return 'es';
    }
  }

  return 'en';
}

function pickFilePath(locale = 'en'): string | null {
  const preferredFile = locale === 'es'
    ? 'treachery-cards-es.json'
    : 'treachery-cards-en.json';

  const candidates = [
    join(process.cwd(), preferredFile),
    join(import.meta.dirname, `../../../${preferredFile}`),
    join(import.meta.dirname, `../../${preferredFile}`),
    join(process.cwd(), 'treachery-cards-en.json'),
    join(import.meta.dirname, '../../../treachery-cards-en.json'),
    join(import.meta.dirname, '../../treachery-cardsen.json'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function loadRolePools(locale = 'en'): RolePools {
  try {
    const filePath = pickFilePath(locale);
    if (!filePath) {
      console.warn('Role cards file not found. Using fallback role cards.');
      return {
        leader: FALLBACK_LEADER_CARDS,
        guardian: FALLBACK_GUARDIAN_CARDS,
        assassin: FALLBACK_ASSASSIN_CARDS,
        traitor: FALLBACK_TRAITOR_CARDS,
      };
    }

    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as TreacheryDataFile;
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];

    const leader = cards
      .filter((card) => cardSubtype(card).toUpperCase() === 'LEADER')
      .map((card) => toRoleTemplate(card));

    const guardian = cards
      .filter((card) => cardSubtype(card).toUpperCase() === 'GUARDIAN')
      .map((card) => toRoleTemplate(card));

    const assassin = cards
      .filter((card) => cardSubtype(card).toUpperCase() === 'ASSASSIN')
      .map((card) => toRoleTemplate(card));

    const traitor = cards
      .filter((card) => cardSubtype(card).toUpperCase() === 'TRAITOR')
      .map((card) => toRoleTemplate(card));

    if (leader.length === 0 || guardian.length === 0 || assassin.length === 0 || traitor.length === 0) {
      console.warn(
        'Role cards JSON missing one or more role groups (Leader/Guardian/Assassin/Traitor). Using fallback role cards.',
      );
      return {
        leader: FALLBACK_LEADER_CARDS,
        guardian: FALLBACK_GUARDIAN_CARDS,
        assassin: FALLBACK_ASSASSIN_CARDS,
        traitor: FALLBACK_TRAITOR_CARDS,
      };
    }

    console.log(
      `Loaded role cards from ${filePath}. Leader: ${leader.length}, Guardian: ${guardian.length}, Assassin: ${assassin.length}, Traitor: ${traitor.length}.`,
    );

    return {
      leader,
      guardian,
      assassin,
      traitor,
    };
  } catch (error) {
    console.warn('Failed to load role cards JSON. Using fallback role cards.', error);
    return {
      leader: FALLBACK_LEADER_CARDS,
      guardian: FALLBACK_GUARDIAN_CARDS,
      assassin: FALLBACK_ASSASSIN_CARDS,
      traitor: FALLBACK_TRAITOR_CARDS,
    };
  }
}

async function getRoomOrFail(
  roomRepository: RoomRepository,
  roomCode: string,
  res: express.Response,
): Promise<Room | null> {
  const room = await roomRepository.get(roomCode.toUpperCase());

  if (!room) {
    res.status(404).json({ error: 'Room not found.' });
    return null;
  }

  return room;
}

function serializeRoom(room: Room) {
  return {
    code: room.code,
    status: room.status,
    createdAt: room.createdAt,
    hostPlayerCode: room.hostPlayerCode,
    players: room.players.map((player) => ({
      code: player.code,
      joinedAt: player.joinedAt,
    })),
  };
}

app.use(express.json());

app.post('/api/rooms', async (req, res) => {
  const roomRepository = await getRoomRepository();
  const roomCode = await createUniqueRoomCode(roomRepository);
  const room: Room = {
    code: roomCode,
    createdAt: Date.now(),
    status: 'LOBBY',
    hostPlayerCode: '',
    players: [],
  };

  const player: Player = {
    code: createPlayerCode(room),
    joinedAt: Date.now(),
  };

  room.hostPlayerCode = player.code;
  room.players.push(player);
  await roomRepository.set(room);

  res.status(201).json({
    room: serializeRoom(room),
    playerCode: player.code,
  });
});

app.post('/api/rooms/:roomCode/join', async (req, res) => {
  const roomRepository = await getRoomRepository();
  const room = await getRoomOrFail(roomRepository, req.params['roomCode'], res);
  if (!room) {
    return;
  }

  if (room.status !== 'LOBBY') {
    res.status(409).json({ error: 'Game already started in this room.' });
    return;
  }

  if (room.players.length >= 12) {
    res.status(409).json({ error: 'Room is full.' });
    return;
  }

  const player: Player = {
    code: createPlayerCode(room),
    joinedAt: Date.now(),
  };

  room.players.push(player);
  await roomRepository.set(room);

  res.status(201).json({
    room: serializeRoom(room),
    playerCode: player.code,
  });
});

app.post('/api/rooms/:roomCode/start', async (req, res) => {
  const roomRepository = await getRoomRepository();
  const room = await getRoomOrFail(roomRepository, req.params['roomCode'], res);
  if (!room) {
    return;
  }

  if (room.status === 'STARTED') {
    res.status(409).json({ error: 'Game already started.' });
    return;
  }

  const requesterPlayerCode = typeof req.body?.playerCode === 'string' ? req.body.playerCode : '';
  if (requesterPlayerCode !== room.hostPlayerCode) {
    res.status(403).json({ error: 'Only host can start the game.' });
    return;
  }

  if (room.players.length < 4) {
    res.status(400).json({ error: 'Treachery requires at least 4 players.' });
    return;
  }

  const rolePlan = shuffle(buildRolePlan(room.players.length));
  const locale = getPreferredLocale(req.headers['accept-language']);

  room.players.forEach((player, index) => {
    const plannedRole = rolePlan[index] ?? 'GUARDIAN';
    player.roleCard = makeCardFromRole(plannedRole, locale);
  });

  room.status = 'STARTED';
  await roomRepository.set(room);

  const roleSummary = room.players.reduce(
    (summary, player) => {
      const role = player.roleCard?.role ?? 'GUARDIAN';
      summary[role] += 1;
      return summary;
    },
    {
      LEADER: 0,
      GUARDIAN: 0,
      ASSASSIN: 0,
      TRAITOR: 0,
    } as Record<IdentityRole, number>,
  );

  res.json({
    room: serializeRoom(room),
    message: 'Game started and identity roles were dealt.',
    roleSummary,
  });
});

app.get('/api/rooms/:roomCode', async (req, res) => {
  const roomRepository = await getRoomRepository();
  const room = await getRoomOrFail(roomRepository, req.params['roomCode'], res);
  if (!room) {
    return;
  }

  res.json({ room: serializeRoom(room) });
});

app.get('/api/rooms/:roomCode/role', async (req, res) => {
  const roomRepository = await getRoomRepository();
  const room = await getRoomOrFail(roomRepository, req.params['roomCode'], res);
  if (!room) {
    return;
  }

  const playerCode = typeof req.query['playerCode'] === 'string' ? req.query['playerCode'] : '';
  const player = room.players.find((entry) => entry.code === playerCode);

  if (!player) {
    res.status(404).json({ error: 'Player not found in room.' });
    return;
  }

  if (room.status !== 'STARTED' || !player.roleCard) {
    res.status(409).json({ error: 'Game not started yet.' });
    return;
  }

  res.json({
    roomCode: room.code,
    playerCode: player.code,
    card: player.roleCard,
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['FORCE_LISTEN'] === '1') {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
