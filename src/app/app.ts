import { Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  protected readonly appTitle = 'MTG Treachery Room';
  protected readonly playerName = signal('');
  protected readonly renameInput = signal('');
  protected readonly roomCodeInput = signal('');
  protected readonly activeRoomCode = signal('');
  protected readonly activePlayerCode = signal('');
  protected readonly room = signal<RoomDto | null>(null);
  protected readonly roleCard = signal<RoleCardDto | null>(null);
  protected readonly busy = signal(false);
  protected readonly isDealing = signal(false);
  protected readonly message = signal('Create a room or join one with a room code.');

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly isHost = computed(
    () =>
      this.room() !== null &&
      this.activePlayerCode().length > 0 &&
      this.room()?.hostPlayerCode === this.activePlayerCode(),
  );

  protected readonly currentPlayer = computed(() => {
    const room = this.room();
    const playerCode = this.activePlayerCode();

    if (!room || !playerCode) {
      return null;
    }

    return room.players.find((player) => player.code === playerCode) ?? null;
  });

  protected readonly cardImageUrl = computed(() => {
    const card = this.roleCard();
    if (!card) {
      return '/card-art-guardian.svg';
    }

    switch (card.role) {
      case 'LEADER':
        return '/card-art-leader.svg';
      case 'ASSASSIN':
        return '/card-art-assassin.svg';
      case 'TRAITOR':
        return '/card-art-traitor.svg';
      default:
        return '/card-art-guardian.svg';
    }
  });

  constructor() {
    if (this.canUseStorage()) {
      const storage = globalThis.localStorage;
      const savedRoomCode = storage.getItem('mtg.roomCode') ?? '';
      const savedPlayerCode = storage.getItem('mtg.playerCode') ?? '';

      if (savedRoomCode.length > 0) {
        this.activeRoomCode.set(savedRoomCode);
        this.roomCodeInput.set(savedRoomCode);
      }

      if (savedPlayerCode.length > 0) {
        this.activePlayerCode.set(savedPlayerCode);
      }

      if (savedRoomCode.length > 0) {
        void this.refreshRoom();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopRoomPolling();
  }

  protected async createRoom(): Promise<void> {
    await this.withBusy(async () => {
      const payload = { playerName: this.cleanName() };
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      this.activeRoomCode.set((data['room'] as RoomDto).code);
      this.roomCodeInput.set((data['room'] as RoomDto).code);
      this.activePlayerCode.set(data['playerCode'] as string);
      this.roleCard.set(null);
      this.isDealing.set(false);
      this.persistPlayerState();
      this.updateRenameFromCurrentPlayer();
      this.startRoomPolling();
      this.message.set('Room created. Share the room code so others can join.');
    });
  }

  protected async joinRoom(): Promise<void> {
    const roomCode = this.roomCodeInput().trim().toUpperCase();
    if (!roomCode) {
      this.message.set('Type a room code before joining.');
      return;
    }

    await this.withBusy(async () => {
      const payload = { playerName: this.cleanName() };
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      this.activeRoomCode.set((data['room'] as RoomDto).code);
      this.activePlayerCode.set(data['playerCode'] as string);
      this.roleCard.set(null);
      this.isDealing.set(false);
      this.persistPlayerState();
      this.updateRenameFromCurrentPlayer();
      this.startRoomPolling();
      this.message.set('Joined room. Wait for host to start the game.');
    });
  }

  protected async refreshRoom(silent = false): Promise<void> {
    const roomCode = (this.activeRoomCode() || this.roomCodeInput()).trim().toUpperCase();
    if (!roomCode) {
      return;
    }

    if (silent) {
      try {
        const response = await fetch(`/api/rooms/${roomCode}`);
        const data = await this.readResponse(response);
        this.room.set(data['room'] as RoomDto);
        this.activeRoomCode.set((data['room'] as RoomDto).code);
        this.persistPlayerState();
        this.updateRenameFromCurrentPlayer();
        this.syncStartedState();
      } catch {
        return;
      }
      return;
    }

    await this.withBusy(async () => {
      const response = await fetch(`/api/rooms/${roomCode}`);
      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      this.activeRoomCode.set((data['room'] as RoomDto).code);
      this.persistPlayerState();
      this.updateRenameFromCurrentPlayer();
      this.syncStartedState();
      this.startRoomPolling();
    });
  }

  protected async startGame(): Promise<void> {
    const roomCode = this.activeRoomCode();
    if (!roomCode) {
      this.message.set('Join a room before starting a game.');
      return;
    }

    await this.withBusy(async () => {
      this.isDealing.set(true);
      this.message.set('The roles are being dealt right now...');

      const response = await fetch(`/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerCode: this.activePlayerCode() }),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      const roleSummary = data['roleSummary'] as RoleSummaryDto | undefined;
      const summaryText = roleSummary
        ? ` Roles: L=${roleSummary.LEADER}, G=${roleSummary.GUARDIAN}, A=${roleSummary.ASSASSIN}, T=${roleSummary.TRAITOR}.`
        : '';
      this.message.set(((data['message'] as string) || 'Game started.') + summaryText);
      this.syncStartedState();
    });
  }

  protected async loadRoleCard(silent = false): Promise<void> {
    const roomCode = this.activeRoomCode();
    const playerCode = this.activePlayerCode();

    if (!roomCode || !playerCode) {
      this.message.set('Missing room or player code in browser storage.');
      return;
    }

    if (silent) {
      try {
        const response = await fetch(
          `/api/rooms/${roomCode}/role?playerCode=${encodeURIComponent(playerCode)}`,
        );
        const data = await this.readResponse(response);
        this.roleCard.set(data['card'] as RoleCardDto);
        this.isDealing.set(false);
        this.message.set('Role card loaded. Keep it private during the game.');
      } catch {
        return;
      }
      return;
    }

    await this.withBusy(async () => {
      const response = await fetch(
        `/api/rooms/${roomCode}/role?playerCode=${encodeURIComponent(playerCode)}`,
      );
      const data = await this.readResponse(response);
      this.roleCard.set(data['card'] as RoleCardDto);
      this.isDealing.set(false);
      this.message.set('Role card loaded. Keep it private during the game.');
    });
  }

  protected async saveMyName(): Promise<void> {
    const roomCode = this.activeRoomCode();
    const playerCode = this.activePlayerCode();

    if (!roomCode || !playerCode) {
      this.message.set('Join a room before changing your name.');
      return;
    }

    await this.withBusy(async () => {
      const response = await fetch(`/api/rooms/${roomCode}/players/${playerCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: this.renameInput().trim() }),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      this.playerName.set((data['playerName'] as string) || this.renameInput().trim());
      this.updateRenameFromCurrentPlayer();
      this.message.set('Your display name was updated.');
    });
  }

  protected clearLocalPlayer(): void {
    this.stopRoomPolling();
    this.activePlayerCode.set('');
    this.activeRoomCode.set('');
    this.roomCodeInput.set('');
    this.renameInput.set('');
    this.room.set(null);
    this.roleCard.set(null);
    this.isDealing.set(false);
    this.message.set('Local player data removed from browser storage.');

    if (this.canUseStorage()) {
      const storage = globalThis.localStorage;
      storage.removeItem('mtg.roomCode');
      storage.removeItem('mtg.playerCode');
    }
  }

  private cleanName(): string {
    const value = this.playerName().trim();
    return value.length > 0 ? value : 'Player';
  }

  private async withBusy(action: () => Promise<void>): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);

    try {
      await action();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unexpected error';
      this.message.set(text);
    } finally {
      this.busy.set(false);
    }
  }

  private async readResponse(response: Response): Promise<Record<string, unknown>> {
    const body = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(typeof body['error'] === 'string' ? body['error'] : 'Request failed.');
    }

    return body;
  }

  private persistPlayerState(): void {
    if (!this.canUseStorage()) {
      return;
    }

    const storage = globalThis.localStorage;

    if (this.activeRoomCode()) {
      storage.setItem('mtg.roomCode', this.activeRoomCode());
    }

    if (this.activePlayerCode()) {
      storage.setItem('mtg.playerCode', this.activePlayerCode());
    }
  }

  private updateRenameFromCurrentPlayer(): void {
    const player = this.currentPlayer();
    if (!player) {
      return;
    }

    this.renameInput.set(player.name);
  }

  private startRoomPolling(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.refreshTimer) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      void this.refreshRoom(true);
    }, 2500);
  }

  private stopRoomPolling(): void {
    if (!this.refreshTimer) {
      return;
    }

    clearInterval(this.refreshTimer);
    this.refreshTimer = null;
  }

  private syncStartedState(): void {
    const room = this.room();
    if (!room) {
      return;
    }

    if (room.status === 'STARTED' && !this.roleCard()) {
      this.isDealing.set(true);
      this.message.set('The roles are being dealt right now...');
      void this.loadRoleCard(true);
    }
  }

  private canUseStorage(): boolean {
    return typeof globalThis.localStorage !== 'undefined';
  }
}

interface RoomPlayerDto {
  code: string;
  name: string;
  joinedAt: number;
}

interface RoomDto {
  code: string;
  status: 'LOBBY' | 'STARTED';
  createdAt: number;
  hostPlayerCode: string;
  players: RoomPlayerDto[];
}

interface RoleCardDto {
  role: 'LEADER' | 'GUARDIAN' | 'ASSASSIN' | 'TRAITOR';
  team: 'LEADER_TEAM' | 'ASSASSINS_TEAM' | 'TRAITOR_TEAM';
  title: string;
  objective: string;
  hint: string;
}

interface RoleSummaryDto {
  LEADER: number;
  GUARDIAN: number;
  ASSASSIN: number;
  TRAITOR: number;
}
