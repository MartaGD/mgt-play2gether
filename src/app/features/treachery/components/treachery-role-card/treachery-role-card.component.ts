import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ObjectiveTextPipe } from '../../objective-text.pipe';
import { RoleCardDto } from '../../treachery.models';
import { getTranslation } from '../../../../shared/translations';

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

  readonly t = {
    subtitle: getTranslation('general', 'subtitle'),
    eyebrow: getTranslation('home', 'eyebrow'),
    treacheryTitle: getTranslation('home', 'treacheryTitle'),
    description: getTranslation('home', 'description'),
    primaryCta: getTranslation('home', 'primaryCta'),
    secondaryCta: getTranslation('home', 'secondaryCta'),
    moreTitle: getTranslation('home', 'moreTitle'),
    moreDescription: getTranslation('home', 'moreDescription'),
    lifeTitle: getTranslation('home', 'lifeTitle'),
    lifeDescription: getTranslation('home', 'lifeDescription'),
    lifeCta: getTranslation('home', 'lifeCta'),
  };

}

