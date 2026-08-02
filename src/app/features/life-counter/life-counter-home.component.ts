import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-life-counter-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './life-counter-home.component.html',
  styleUrl: './life-counter-home.component.scss',
})
export class LifeCounterHomeComponent {
  playerCount = 4;
  startingLife = 20;
  playerOptions = [2, 3, 4, 5, 6, 7, 8];

  constructor(private readonly router: Router) {}

  startCounter(): void {
    this.router.navigate(['/life-counter/counter'], {
      queryParams: {
        players: this.playerCount,
        startingLife: this.startingLife,
      },
    });
  }
}
