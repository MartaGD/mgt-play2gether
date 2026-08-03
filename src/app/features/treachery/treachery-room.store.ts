import { Injectable, computed, signal } from '@angular/core';
import { RoleCardDto, RoleSummaryDto, RoomDto, RoomPlayerDto } from './treachery.models';
import { getTranslation } from '../../shared/translations'; 

interface ExpiringStorageEntry {
  value: string;
  expiresAt: number;
}


@Injectable({ providedIn: 'root' })
export class TreacheryRoomStore {
  private static readonly storageTtlMs = 24 * 60 * 60 * 1000;
  private static readonly debugRoleCardTitleParam = 'roleCard.title';

  readonly t = {
    subtitle: getTranslation('treachery', 'homeTitle')
  };

  readonly appTitle = this.t.subtitle;
  readonly roomCodeInput = signal('');
  readonly activeRoomCode = signal('');
  readonly activePlayerCode = signal('');
  readonly room = signal<RoomDto | null>(null);
  readonly roleCard = signal<RoleCardDto | null>(null);
  readonly busy = signal(false);
  readonly isDealing = signal(false);
  readonly message = signal('');

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly debugRoleCardTitle = this.readDebugRoleCardTitle();

  readonly isHost = computed(
    () =>
      this.room() !== null &&
      this.activePlayerCode().length > 0 &&
      this.room()?.hostPlayerCode === this.activePlayerCode(),
  );

  readonly currentPlayer = computed(() => {
    const room = this.room();
    const playerCode = this.activePlayerCode();

    if (!room || !playerCode) {
      return null;
    }

    return room.players.find((player) => player.code === playerCode) ?? null;
  });

  readonly cardImageUrl = computed(() => {
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
    if (this.debugRoleCardTitle) {
      this.message.set('Debug role card preview active from query param roleCard.title.');
      return;
    }

    if (this.canUseStorage()) {
      const savedRoomCode = this.getStoredValue('mtg.roomCode');
      const savedPlayerCode = this.getStoredValue('mtg.playerCode');

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

  destroy(): void {
    this.stopRoomPolling();
  }

  async createRoom(): Promise<void> {
    await this.withBusy(async () => {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      this.activePlayerCode.set(data['playerCode'] as string);
      this.activeRoomCode.set((data['room'] as RoomDto).code);
      this.roomCodeInput.set((data['room'] as RoomDto).code);
      this.roleCard.set(null);
      this.isDealing.set(false);
      this.persistPlayerState();
      this.startRoomPolling();
      this.message.set('Room created. Share the room code so others can join.');
    });
  }

  async joinRoom(): Promise<void> {
    const roomCode = this.ensureRoomCode();
    if (!roomCode) {
      this.message.set('Type a room code before joining.');
      return;
    }

    await this.withBusy(async () => {
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      this.activePlayerCode.set(data['playerCode'] as string);
      this.activeRoomCode.set((data['room'] as RoomDto).code);
      this.roomCodeInput.set((data['room'] as RoomDto).code);
      this.roleCard.set(null);
      this.isDealing.set(false);
      this.persistPlayerState();
      this.startRoomPolling();
      this.message.set('Joined room. Wait for host to start the game.');
    });
  }

  async refreshRoom(silent = false): Promise<void> {
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

      this.syncStartedState();
      this.startRoomPolling();
    });
  }

  async startGame(): Promise<void> {
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

  async loadRoleCard(silent = false): Promise<void> {
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

  leaveRoom(): void {
    this.stopRoomPolling();
    this.activePlayerCode.set('');
    this.activeRoomCode.set('');
    this.roomCodeInput.set('');
    this.room.set(null);
    this.roleCard.set(null);
    this.isDealing.set(false);
    this.message.set('You left the room on this browser. You can create or join another one.');
    this.persistPlayerState();
  }

  clearLocalPlayer(): void {
    this.leaveRoom();
    this.message.set('Local player data removed from this browser.');
  }

  private ensureRoomCode(): string {
    const current = this.roomCodeInput().trim().toUpperCase();
    if (current.length > 0) {
      return current;
    }

    if (typeof globalThis.prompt !== 'function') {
      return '';
    }

    const input = globalThis.prompt('Type the room code to join:', '');
    if (typeof input !== 'string') {
      return '';
    }

    const normalized = input.trim().toUpperCase().slice(0, 6);
    if (!normalized) {
      return '';
    }

    this.roomCodeInput.set(normalized);
    return normalized;
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
      this.roomCodeInput.set('');
      this.message.set(text);
      alert(`Error: ${text}`);
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

    if (this.activeRoomCode()) {
      this.setStoredValue('mtg.roomCode', this.activeRoomCode());
    } else {
      this.removeStoredValue('mtg.roomCode');
    }

    if (this.activePlayerCode()) {
      this.setStoredValue('mtg.playerCode', this.activePlayerCode());
    } else {
      this.removeStoredValue('mtg.playerCode');
    }
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
    }, 4500);
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

  private getStoredValue(key: string): string {
    const storage = globalThis.localStorage;
    const raw = storage.getItem(key);

    if (!raw) {
      return '';
    }

    try {
      const entry = JSON.parse(raw) as ExpiringStorageEntry;

      if (typeof entry.value !== 'string' || typeof entry.expiresAt !== 'number') {
        this.removeStoredValue(key);
        return '';
      }

      if (Date.now() > entry.expiresAt) {
        this.removeStoredValue(key);
        return '';
      }

      return entry.value;
    } catch {
      this.removeStoredValue(key);
      return '';
    }
  }

  private setStoredValue(key: string, value: string): void {
    const storage = globalThis.localStorage;
    const entry: ExpiringStorageEntry = {
      value,
      expiresAt: Date.now() + TreacheryRoomStore.storageTtlMs,
    };

    storage.setItem(key, JSON.stringify(entry));
  }

  private removeStoredValue(key: string): void {
    globalThis.localStorage.removeItem(key);
  }

  private canUseStorage(): boolean {
    return typeof globalThis.localStorage !== 'undefined';
  }

  private readDebugRoleCardTitle(): string {
    if (typeof globalThis.location === 'undefined') {
      return '';
    }

    return new URLSearchParams(globalThis.location.search).get(
      TreacheryRoomStore.debugRoleCardTitleParam,
    )?.trim() ?? '';
  }
}
