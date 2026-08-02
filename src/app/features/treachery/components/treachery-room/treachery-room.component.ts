import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomDto, RoomPlayerDto } from '../../treachery.models';

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
}
