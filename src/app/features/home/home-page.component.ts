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
    moreTitle: getTranslation('home', 'moreTitle'),
    moreDescription: getTranslation('home', 'moreDescription'),

    treacheryTitle: getTranslation('treachery', 'homeTitle'),
    treacheryDescription: getTranslation('treachery', 'homeDescription'),
    treacheryPrimaryCta: getTranslation('treachery', 'homePrimaryCta'),
    treacherySecondaryCta: getTranslation('treachery', 'homeSecondaryCta'),

    kingdomTitle: getTranslation('kingdom', 'homeTitle'),
    kingdomDescription: getTranslation('kingdom', 'homeDescription'),
    kingdomPrimaryCta: getTranslation('kingdom', 'homePrimaryCta'),
    kingdomSecondaryCta: getTranslation('kingdom', 'homeSecondaryCta'),


    lifeTitle: getTranslation('lifeCounter', 'homeTitle'),
    lifeDescription: getTranslation('lifeCounter', 'homeDescription'),
    lifeCta: getTranslation('lifeCounter', 'homePrimaryCta'),
  };
}
