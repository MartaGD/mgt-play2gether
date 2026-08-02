import { Component, OnDestroy } from '@angular/core';
import { TreacheryHomeComponent } from './components/treachery-home/treachery-home.component';
import { TreacheryRoleCardComponent } from './components/treachery-role-card/treachery-role-card.component';
import { TreacheryRoomComponent } from './components/treachery-room/treachery-room.component';
import { TreacheryRoomStore } from './treachery-room.store';

@Component({
  selector: 'app-treachery-page',
  standalone: true,
  imports: [TreacheryHomeComponent, TreacheryRoomComponent, TreacheryRoleCardComponent],
  templateUrl: './treachery-page.component.html',
  styleUrl: './treachery-page.component.scss',
})
export class TreacheryPageComponent implements OnDestroy {
  protected readonly store: TreacheryRoomStore;

  constructor(private readonly treacheryStore: TreacheryRoomStore) {
    this.store = treacheryStore;
  }

  ngOnDestroy(): void {
    this.store.destroy();
  }
}
