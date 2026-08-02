import { Component, OnDestroy, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TreacheryHomeComponent } from './components/treachery-home/treachery-home.component';
import { TreacheryRoleCardComponent } from './components/treachery-role-card/treachery-role-card.component';
import { TreacheryRoomComponent } from './components/treachery-room/treachery-room.component';
import { RoleCardDto } from './treachery.models';
import { TreacheryRoomStore } from './treachery-room.store';

@Component({
  selector: 'app-treachery-page',
  standalone: true,
  imports: [TreacheryHomeComponent, TreacheryRoomComponent, TreacheryRoleCardComponent],
  templateUrl: './treachery-page.component.html',
  styleUrl: './treachery-page.component.scss',
})
export class TreacheryPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);

  protected readonly store: TreacheryRoomStore;
  protected readonly debugRoleCard = computed<RoleCardDto | null>(() => {
    const title = this.route.snapshot.queryParamMap.get('roleCard.title')?.trim();

    if (!title) {
      return null;
    }

    return {
      role: 'LEADER',
      team: 'LEADER_TEAM',
      title,
      objective: 'Debug objective {0} redraw this card to review spacing, fonts, icons, and long text wrapping.',
      hint: 'Debug preview loaded from query param roleCard.title.',
      rulings: 'Debug preview loaded from query param roleCard.title.',
    };
  });
  protected readonly visibleRoleCard = computed(() => this.store.roleCard() ?? this.debugRoleCard());
  protected readonly visibleCardImageUrl = computed(() => {
    const role = this.visibleRoleCard()?.role;

    switch (role) {
      case 'LEADER':
        return '/card-art-leader.svg';
      case 'ASSASSIN':
        return '/card-art-assassin.svg';
      case 'TRAITOR':
        return '/card-art-traitor.svg';
      default:
        return '/card-art-guardian.svg';
    }
  });

  constructor(private readonly treacheryStore: TreacheryRoomStore) {
    this.store = treacheryStore;
  }

  ngOnDestroy(): void {
    this.store.destroy();
  }
}
