import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getTranslation } from '../../shared/translations';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  readonly t = {
    eyebrow: getTranslation('home', 'eyebrow'),
    title: getTranslation('home', 'title'),
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
