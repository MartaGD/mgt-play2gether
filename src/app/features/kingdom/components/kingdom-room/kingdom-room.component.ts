import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomDto, RoomPlayerDto } from '../../kingdom.models';
import { getTranslation } from '../../../../shared/translations';

@Component({
  selector: 'app-kingdom-room',
  standalone: true,
  templateUrl: './kingdom-room.component.html',
  styleUrl: './kingdom-room.component.scss',
})
export class KingdomRoomComponent {
  @Input({ required: true }) room!: RoomDto;
  @Input({ required: true }) activePlayerCode!: string;
  @Input({ required: true }) isHost!: boolean;
  @Input({ required: true }) currentPlayer!: RoomPlayerDto | null;
  @Input({ required: true }) busy!: boolean;
  @Input({ required: true }) isDealing!: boolean;
  @Input({ required: true }) message!: string;

  @Output() refreshClick = new EventEmitter<void>();
  @Output() startGameClick = new EventEmitter<void>();
  @Output() leaveRoomClick = new EventEmitter<void>();

  readonly t = {   
    roomCodeLabel: getTranslation('kingdom', 'roomCodeLabel'),
    roomPlayerCode: getTranslation('kingdom', 'roomPlayerCode'),
    roomRequiredPlayers: getTranslation('kingdom', 'roomRequiredPlayers'),
    playerCodeLabel: getTranslation('general', 'playerCodeLabel'),
    refreshButton: getTranslation('kingdom', 'refreshButton'),
    startGameButton: getTranslation('kingdom', 'startGameButton'),
    leaveRoomButton: getTranslation('kingdom', 'leaveRoomButton'),
    dealingMessage: getTranslation('kingdom', 'dealingMessage'),
    waitingPlayersMessage: getTranslation('kingdom', 'waitingPlayersMessage'),
    notSet: getTranslation('kingdom', 'notSet'),
    youTag: getTranslation('kingdom', 'youTag'),
    hostTag: getTranslation('kingdom', 'hostTag'),
    bufferingLabel: getTranslation('kingdom', 'bufferingLabel'),
    copyRoomCodeSuccess: getTranslation('kingdom', 'copyRoomCodeSuccess'),
    copyRoomCodeError: getTranslation('kingdom', 'copyRoomCodeError'),
  };

copyText(): void {
  const text = this.room.code;

  navigator.clipboard.writeText(text)
    .then(() => alert(this.t.copyRoomCodeSuccess.replace('{code}', text)))
    .catch((error) => {
      console.error(this.t.copyRoomCodeError, error);
      alert(this.t.copyRoomCodeError);
    });
}


}

