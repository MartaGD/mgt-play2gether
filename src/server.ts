import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
const angularApp = new AngularNodeAppEngine();

const rooms = new Map<string, Room>();

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

const rolePools = loadRolePools();

function randomCode(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return value;
}

function createUniqueRoomCode(): string {
  let code = randomCode(6);

  while (rooms.has(code)) {
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
  if (typeof value !== 'string') {
    return fallback;
  }

  const cleaned = value.replaceAll('|', '. ').trim();
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

  return {
    title,
    objective,
    hint: `${typeText} | ${colorText}`,
    rulings: `Rulings for ${title}: ${objective}`,
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

function makeCardFromRole(role: IdentityRole): RoleCard {
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

function pickFilePath(): string | null {
  const candidates = [
    join(process.cwd(), 'treachery-cards.json'),
    join(import.meta.dirname, '../../../treachery-cards.json'),
    join(import.meta.dirname, '../../treachery-cards.json'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function loadRolePools(): RolePools {
  try {
    const filePath = pickFilePath();
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

function getRoomOrFail(roomCode: string, res: express.Response): Room | null {
  const room = rooms.get(roomCode.toUpperCase());

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

app.post('/api/rooms', (req, res) => {
  const roomCode = createUniqueRoomCode();
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
  rooms.set(room.code, room);

  res.status(201).json({
    room: serializeRoom(room),
    playerCode: player.code,
  });
});

app.post('/api/rooms/:roomCode/join', (req, res) => {
  const room = getRoomOrFail(req.params['roomCode'], res);
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

  res.status(201).json({
    room: serializeRoom(room),
    playerCode: player.code,
  });
});

app.post('/api/rooms/:roomCode/start', (req, res) => {
  const room = getRoomOrFail(req.params['roomCode'], res);
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

  room.players.forEach((player, index) => {
    const plannedRole = rolePlan[index] ?? 'GUARDIAN';
    player.roleCard = makeCardFromRole(plannedRole);
  });

  room.status = 'STARTED';

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

app.get('/api/rooms/:roomCode', (req, res) => {
  const room = getRoomOrFail(req.params['roomCode'], res);
  if (!room) {
    return;
  }

  res.json({ room: serializeRoom(room) });
});

app.get('/api/rooms/:roomCode/role', (req, res) => {
  const room = getRoomOrFail(req.params['roomCode'], res);
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
