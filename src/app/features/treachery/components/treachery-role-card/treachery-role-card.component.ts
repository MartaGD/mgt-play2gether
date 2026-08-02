import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ObjectiveTextPipe } from '../../objective-text.pipe';
import { RoleCardDto } from '../../treachery.models';

@Component({
  selector: 'app-treachery-role-card',
  standalone: true,
  imports: [ObjectiveTextPipe],
  templateUrl: './treachery-role-card.component.html',
  styleUrl: './treachery-role-card.component.scss',
})
export class TreacheryRoleCardComponent {
  @Input({ required: true }) roleCard!: RoleCardDto;
  @Input({ required: true }) cardImageUrl!: string;
  @Input({ required: true }) busy!: boolean;
  @Input({ required: true }) message!: string;

  @Output() refreshRoomClick = new EventEmitter<void>();
  @Output() leaveRoomClick = new EventEmitter<void>();
}

