import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomDto, RoomPlayerDto } from '../../treachery.models';
import { getTranslation } from '../../../../shared/translations';

@Component({
  selector: 'app-treachery-room',
  standalone: true,
  templateUrl: './treachery-room.component.html',
  styleUrl: './treachery-room.component.scss',
})
export class TreacheryRoomComponent {
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
    roomCodeLabel: getTranslation('treachery', 'roomCodeLabel'),
    roomPlayerCode: getTranslation('treachery', 'roomPlayerCode'),
    roomRequiredPlayers: getTranslation('treachery', 'roomRequiredPlayers'),
    playerCodeLabel: getTranslation('general', 'playerCodeLabel'),
    refreshButton: getTranslation('treachery', 'refreshButton'),
    startGameButton: getTranslation('treachery', 'startGameButton'),
    leaveRoomButton: getTranslation('treachery', 'leaveRoomButton'),
    dealingMessage: getTranslation('treachery', 'dealingMessage'),
    waitingPlayersMessage: getTranslation('treachery', 'waitingPlayersMessage'),
    notSet: getTranslation('treachery', 'notSet'),
    youTag: getTranslation('treachery', 'youTag'),
    hostTag: getTranslation('treachery', 'hostTag'),
    bufferingLabel: getTranslation('treachery', 'bufferingLabel'),
    copyRoomCodeSuccess: getTranslation('treachery', 'copyRoomCodeSuccess'),
    copyRoomCodeError: getTranslation('treachery', 'copyRoomCodeError'),
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

