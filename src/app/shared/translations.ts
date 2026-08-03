
/*/
export const translations = {
  en: {
    home: {
      title: 'Play Together, Betray Together',
      description: 'Welcome to your multiplayer tabletop space. Build private rooms, invite friends and launch social formats.',
      primaryCta: 'Open Treachery',
      secondaryCta: 'Join With Room Code',
      moreTitle: 'More games in the future!',
      moreDescription: 'Watch this space for upcoming games and features.',
      lifeTitle: 'Count your HP',
      lifeDescription: 'Keep track of your life total with a simple and easy to use life counter. Add players, set starting life totals, and adjust life as needed.',
      lifeCta: 'Open Life Counter',
    },
    lifeCounter: {
      homeTitle: 'Life Counter',
      homeDescription: 'Choose how many players are participating and their starting life total.',
      playerCountLabel: 'Number of players',
      startingLifeLabel: 'Starting life',
      startButton: 'Start counter',
      counterTitle: 'Life Counter',
      resetButton: 'Reset',
      playerName: 'Player',
    },
  },
  es: {
    home: {
      title: 'Juega juntos, traiciona juntos',
      description: 'Bienvenido a tu espacio multijugador de mesa. Crea salas privadas, invita amigos y lanza formatos sociales.',
      primaryCta: 'Abrir Treachery',
      secondaryCta: 'Unirse con código de sala',
      moreTitle: '¡Más juegos en el futuro!',
      moreDescription: 'Mira este espacio para próximos juegos y funciones.',
      lifeTitle: 'Cuenta tu HP',
      lifeDescription: 'Sigue tu total de vida con un contador simple y fácil de usar. Añade jugadores, ajusta las vidas iniciales y modifica la vida según sea necesario.',
      lifeCta: 'Abrir contador de vida',
    },
    lifeCounter: {
      homeTitle: 'Contador de vidas',
      homeDescription: 'Elige cuántos jugadores participan y cuánta vida inicial tendrán.',
      playerCountLabel: 'Número de jugadores',
      startingLifeLabel: 'Vidas iniciales',
      startButton: 'Iniciar contador',
      counterTitle: 'Contador de vidas',
      resetButton: 'Reiniciar',
      playerName: 'Jugador',
    },
  },
} as const;
*/
import { en_translations } from './en';
import { es_translations } from './es';
import { ca_translations } from './ca';
export type TranslationKey = typeof en_translations | typeof es_translations | typeof ca_translations;

export function getBrowserLocale(): string {
  if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
    return 'en';
  }

  const browserLanguage = window.navigator.language?.toLowerCase() ?? 'en';
  console.log(browserLanguage);
  return browserLanguage;
}

export function getTranslation<T extends keyof typeof en_translations>(section: T, key: string): string {
  const locale = getBrowserLocale();
  let lang: typeof en_translations;
  switch (locale) {
    case 'ca':
      lang = ca_translations;
      break;
    case 'es':
      lang = es_translations;
      break;
    default:
      lang = en_translations;
  }

  const sectionValue = lang[section] as Record<string, string>;
  return sectionValue[key];
  //return sectionValue[key] ?? en_translations[section][key as keyof (typeof en_translations)[T]] ?? '';
}
