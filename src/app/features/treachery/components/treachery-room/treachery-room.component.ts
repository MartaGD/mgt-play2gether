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
  };

copyText(): void {
  const text = this.room.code;

  navigator.clipboard.writeText(text)
    .then(() => alert(`Room code "${text}" copied to clipboard!`))
    .catch(err => console.error("Error copying to clipboard:", err));
}


}

