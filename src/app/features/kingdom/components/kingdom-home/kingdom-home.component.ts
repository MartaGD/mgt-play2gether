import { Component, EventEmitter, Input, Output } from '@angular/core';
import { getTranslation } from '../../../../shared/translations';

@Component({
  selector: 'app-kingdom-home',
  standalone: true,
  templateUrl: './kingdom-home.component.html',
  styleUrl: './kingdom-home.component.scss',
})
export class KingdomHomeComponent {
  @Input({ required: true }) appTitle!: string;
  @Input({ required: true }) busy!: boolean;
  @Input({ required: true }) message!: string;

  @Output() createRoomClick = new EventEmitter<void>();
  @Output() joinRoomClick = new EventEmitter<void>();

  readonly t = {   
    eyebrow: getTranslation('home', 'eyebrow'),
    description: getTranslation('kingdom', 'description'),
    createButton: getTranslation('kingdom', 'createButton'),
    joinButton: getTranslation('kingdom', 'joinButton'),

  };

}
