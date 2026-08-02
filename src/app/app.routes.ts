import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home-page.component';
import { LifeCounterHomeComponent } from './features/life-counter/life-counter-home.component';
import { LifeCounterPageComponent } from './features/life-counter/life-counter-page.component';
import { TreacheryPageComponent } from './features/treachery/treachery-page.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
	{
		path: '',
		component: MainLayoutComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'home',
			},
			{
				path: 'home',
				component: HomePageComponent,
			},
			{
				path: 'treachery',
				component: TreacheryPageComponent,
			},
			{
				path: 'life-counter',
				component: LifeCounterHomeComponent,
			},
			{
				path: 'life-counter/counter',
				component: LifeCounterPageComponent,
			},
			{
				path: '**',
				redirectTo: 'home',
			},
		],
	},
];
