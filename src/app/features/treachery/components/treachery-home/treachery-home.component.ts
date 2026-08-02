import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-treachery-home',
  standalone: true,
  templateUrl: './treachery-home.component.html',
  styleUrl: './treachery-home.component.scss',
})
export class TreacheryHomeComponent {
  @Input({ required: true }) appTitle!: string;
  @Input({ required: true }) busy!: boolean;
  @Input({ required: true }) message!: string;

  @Output() createRoomClick = new EventEmitter<void>();
  @Output() joinRoomClick = new EventEmitter<void>();
}
