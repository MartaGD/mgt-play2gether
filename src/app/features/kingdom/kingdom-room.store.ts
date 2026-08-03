import { Injectable, computed, signal } from '@angular/core';
import { RoleCardDto, RoleSummaryDto, RoomDto, RoomPlayerDto } from './kingdom.models';
import { getTranslation } from '../../shared/translations'; 

interface ExpiringStorageEntry {
  value: string;
  expiresAt: number;
}


@Injectable({ providedIn: 'root' })
export class KingdomRoomStore {
  private static readonly storageTtlMs = 24 * 60 * 60 * 1000;
  private static readonly debugRoleCardTitleParam = 'roleCard.title';

  readonly t = {
    title: getTranslation('kingdom', 'homeTitle'),
    debugRoleCardPreviewMessage: getTranslation('kingdom', 'debugRoleCardPreviewMessage'),
    roomCreatedMessage: getTranslation('kingdom', 'roomCreatedMessage'),
    typeRoomCodeBeforeJoinMessage: getTranslation('kingdom', 'typeRoomCodeBeforeJoinMessage'),
    joinedRoomMessage: getTranslation('kingdom', 'joinedRoomMessage'),
    joinRoomBeforeStartMessage: getTranslation('kingdom', 'joinRoomBeforeStartMessage'),
    dealingMessage: getTranslation('kingdom', 'dealingMessage'),
    gameStartedFallbackMessage: getTranslation('kingdom', 'gameStartedFallbackMessage'),
    roleSummaryPrefix: getTranslation('kingdom', 'roleSummaryPrefix'),
    missingRoomOrPlayerCodeMessage: getTranslation('kingdom', 'missingRoomOrPlayerCodeMessage'),
    roleCardLoadedMessage: getTranslation('kingdom', 'roleCardLoadedMessage'),
    leaveRoomBrowserMessage: getTranslation('kingdom', 'leaveRoomBrowserMessage'),
    localPlayerDataRemovedMessage: getTranslation('kingdom', 'localPlayerDataRemovedMessage'),
    typeRoomCodePrompt: getTranslation('kingdom', 'typeRoomCodePrompt'),
    unexpectedErrorMessage: getTranslation('kingdom', 'unexpectedErrorMessage'),
    requestFailedMessage: getTranslation('kingdom', 'requestFailedMessage'),
    errorPrefix: getTranslation('kingdom', 'errorPrefix'),
  };

  readonly appTitle = this.t.title;
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
      return '/card-art-leader.svg';
    }

    switch (card.role) {
      case 'KING':
        return '/card-art-leader.svg';
      case 'KNIGHT':
        return '/card-art-guardian.svg';
      case 'ASSASSIN':
        return '/card-art-assassin_kingdom.svg';
      case 'BANDIT':
        return '/card-art-bandit.svg';
      case 'USURPER':
        return '/card-art-usurper.svg';
      default:
        return '/card-art-guardian.svg';
    }
  });

  constructor() {
    if (this.debugRoleCardTitle) {
      this.message.set(this.t.debugRoleCardPreviewMessage);
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
      const response = await fetch('/api/kingdom/rooms', {
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
      this.message.set(this.t.roomCreatedMessage);
    });
  }

  async joinRoom(): Promise<void> {
    const roomCode = this.ensureRoomCode();
    if (!roomCode) {
      this.message.set(this.t.typeRoomCodeBeforeJoinMessage);
      return;
    }

    await this.withBusy(async () => {
      const response = await fetch(`/api/kingdom/rooms/${roomCode}/join`, {
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
      this.message.set(this.t.joinedRoomMessage);
    });
  }

  async refreshRoom(silent = false): Promise<void> {
    const roomCode = (this.activeRoomCode() || this.roomCodeInput()).trim().toUpperCase();
    if (!roomCode) {
      return;
    }

    if (silent) {
      try {
        const response = await fetch(`/api/kingdom/rooms/${roomCode}`);
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
      const response = await fetch(`/api/kingdom/rooms/${roomCode}`);
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
      this.message.set(this.t.joinRoomBeforeStartMessage);
      return;
    }

    await this.withBusy(async () => {
      this.isDealing.set(true);
      this.message.set(this.t.dealingMessage);

      const response = await fetch(`/api/kingdom/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerCode: this.activePlayerCode() }),
      });

      const data = await this.readResponse(response);
      this.room.set(data['room'] as RoomDto);
      const roleSummary = data['roleSummary'] as RoleSummaryDto | undefined;
      const summaryText = roleSummary
        ? ` ${this.t.roleSummaryPrefix}: K=${roleSummary.KING}, Kn=${roleSummary.KNIGHT}, B=${roleSummary.BANDIT}, A=${roleSummary.ASSASSIN}, U=${roleSummary.USURPER}.`
        : '';
      this.message.set(((data['message'] as string) || this.t.gameStartedFallbackMessage) + summaryText);
      this.syncStartedState();
    });
  }

  async loadRoleCard(silent = false): Promise<void> {
    const roomCode = this.activeRoomCode();
    const playerCode = this.activePlayerCode();

    if (!roomCode || !playerCode) {
      this.message.set(this.t.missingRoomOrPlayerCodeMessage);
      return;
    }

    if (silent) {
      try {
        const response = await fetch(
          `/api/kingdom/rooms/${roomCode}/role?playerCode=${encodeURIComponent(playerCode)}`,
        );
        const data = await this.readResponse(response);
        this.roleCard.set(data['card'] as RoleCardDto);
        this.isDealing.set(false);
        this.message.set(this.t.roleCardLoadedMessage);
      } catch {
        return;
      }
      return;
    }

    await this.withBusy(async () => {
      const response = await fetch(
        `/api/kingdom/rooms/${roomCode}/role?playerCode=${encodeURIComponent(playerCode)}`,
      );
      const data = await this.readResponse(response);
      this.roleCard.set(data['card'] as RoleCardDto);
      this.isDealing.set(false);
      this.message.set(this.t.roleCardLoadedMessage);
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
    this.message.set(this.t.leaveRoomBrowserMessage);
    this.persistPlayerState();
  }

  clearLocalPlayer(): void {
    this.leaveRoom();
    this.message.set(this.t.localPlayerDataRemovedMessage);
  }

  private ensureRoomCode(): string {
    const current = this.roomCodeInput().trim().toUpperCase();
    if (current.length > 0) {
      return current;
    }

    if (typeof globalThis.prompt !== 'function') {
      return '';
    }

    const input = globalThis.prompt(this.t.typeRoomCodePrompt, '');
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
      const text = error instanceof Error ? error.message : this.t.unexpectedErrorMessage;
      this.roomCodeInput.set('');
      this.message.set(text);
      alert(`${this.t.errorPrefix}: ${text}`);
    } finally {
      this.busy.set(false);
    }
  }

  private async readResponse(response: Response): Promise<Record<string, unknown>> {
    const body = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(typeof body['error'] === 'string' ? body['error'] : this.t.requestFailedMessage);
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
      this.message.set(this.t.dealingMessage);
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
      expiresAt: Date.now() + KingdomRoomStore.storageTtlMs,
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
      KingdomRoomStore.debugRoleCardTitleParam,
    )?.trim() ?? '';
  }
}
