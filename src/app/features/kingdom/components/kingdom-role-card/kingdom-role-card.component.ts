import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ObjectiveTextPipe } from '../../objective-text.pipe';
import { RoleCardDto } from '../../kingdom.models';
import { getTranslation } from '../../../../shared/translations';

@Component({
  selector: 'app-kingdom-role-card',
  standalone: true,
  imports: [ObjectiveTextPipe],
  templateUrl: './kingdom-role-card.component.html',
  styleUrl: './kingdom-role-card.component.scss',
})
export class KingdomRoleCardComponent {
  @Input({ required: true }) roleCard!: RoleCardDto;
  @Input({ required: true }) cardImageUrl!: string;
  @Input({ required: true }) busy!: boolean;
  @Input({ required: true }) message!: string;

  @Output() refreshRoomClick = new EventEmitter<void>();
  @Output() leaveRoomClick = new EventEmitter<void>();

  readonly t = {
    identityLabel: getTranslation('kingdom', 'identityLabel'),
    teamLabel: getTranslation('kingdom', 'teamLabel'),
    rulingsLabel: getTranslation('kingdom', 'rulingsLabel'),
    refreshRoomButton: getTranslation('kingdom', 'refreshRoomButton'),
    leaveRoomButton: getTranslation('kingdom', 'leaveRoomButton'),
  };

}

