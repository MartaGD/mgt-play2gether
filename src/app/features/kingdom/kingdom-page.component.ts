import { Component, OnDestroy, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KingdomHomeComponent } from './components/kingdom-home/kingdom-home.component';
import { KingdomRoleCardComponent } from './components/kingdom-role-card/kingdom-role-card.component';
import { KingdomRoomComponent } from './components/kingdom-room/kingdom-room.component';
import { RoleCardDto } from './kingdom.models';
import { KingdomRoomStore } from './kingdom-room.store';

@Component({
  selector: 'app-kingdom-page',
  standalone: true,
  imports: [KingdomHomeComponent, KingdomRoomComponent, KingdomRoleCardComponent],
  templateUrl: './kingdom-page.component.html',
  styleUrls: ['./kingdom-page.component.scss'],
})
export class KingdomPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  protected readonly store: KingdomRoomStore;
  protected readonly debugRoleCard = computed<RoleCardDto | null>(() => {
    const title = this.route.snapshot.queryParamMap.get('roleCard.title')?.trim();

    if (!title) {
      return null;
    }

    return {
      role: 'KING',
      team: 'CROWN',
      title,
      objective: 'Debug objective {0} redraw this card to review spacing, fonts, icons, and long text wrapping.<br>Debug objective {0} redraw this card to review spacing, fonts, icons, and long text wrapping.',
      hint: 'Debug preview loaded from query param roleCard.title.',
      rulings: 'Debug preview loaded from query param roleCard.title.',
    };
  });
  protected readonly visibleRoleCard = computed(() => this.store.roleCard() ?? this.debugRoleCard());
  protected readonly visibleCardImageUrl = computed(() => {
    const role = this.visibleRoleCard()?.role;

    switch (role) {
      case 'KING':
        return '/card-art-leader.svg';
      case 'ASSASSIN':
        return '/card-art-assassin.svg';
      case 'BANDIT':
        return '/card-art-traitor.svg';
      case 'USURPER':
        return '/card-art-traitor.svg';
      default:
        return '/card-art-guardian.svg';
    }
  });

  constructor(private readonly kingdomStore: KingdomRoomStore) {
    this.store = kingdomStore;
  }

  ngOnDestroy(): void {
    this.store.destroy();
  }
}
