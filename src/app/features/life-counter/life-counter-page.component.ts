import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface LifePlayer {
  name: string;
  life: number;
}

@Component({
  selector: 'app-life-counter-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './life-counter-page.component.html',
  styleUrl: './life-counter-page.component.scss',
})
export class LifeCounterPageComponent {
  players: LifePlayer[] = [];
  damageOptions = [1, 2, 3, 5, 10];

  constructor(private readonly route: ActivatedRoute) {
    const playerCount = this.parseNumber(this.route.snapshot.queryParamMap.get('players'), 4);
    const startingLife = this.parseNumber(this.route.snapshot.queryParamMap.get('startingLife'), 20);
    const safePlayerCount = Math.min(Math.max(playerCount, 2), 8);

    this.players = Array.from({ length: safePlayerCount }, (_, index) => ({
      name: `Jugador ${index + 1}`,
      life: startingLife,
    }));
  }

  changeLife(index: number, delta: number): void {
    this.players[index].life += delta;
  }

  applyDamage(index: number, amount: number): void {
    this.players[index].life -= amount;
  }

  resetPlayers(): void {
    const startingLife = this.players[0]?.life ?? 20;
    this.players = this.players.map((player, index) => ({
      ...player,
      life: startingLife,
      name: `Jugador ${index + 1}`,
    }));
  }

  private parseNumber(value: string | null, fallback: number): number {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
