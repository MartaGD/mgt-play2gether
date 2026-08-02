import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoleCardDto } from '../../treachery.models';

@Component({
  selector: 'app-treachery-role-card',
  standalone: true,
  templateUrl: './treachery-role-card.component.html',
  styleUrl: './treachery-role-card.component.scss',
})
export class TreacheryRoleCardComponent {
  @Input({ required: true }) roleCard!: RoleCardDto;
  @Input({ required: true }) cardImageUrl!: string;
  @Input({ required: true }) busy!: boolean;
  @Input({ required: true }) message!: string;

  @Output() refreshRoomClick = new EventEmitter<void>();
  @Output() backToLobbyClick = new EventEmitter<void>();
}
