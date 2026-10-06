import type { ImageMetadata } from 'astro';
import icon from '../assets/metoni/icon.webp';
import social from '../assets/metoni/social.webp';
import logging from '../assets/metoni/active_suggest.webp';
import plans from '../assets/metoni/plans.webp';
import session from '../assets/metoni/session.webp';
import home from '../assets/metoni/home_dark.webp';
import library from '../assets/metoni/library_chest.webp';
import rest from '../assets/metoni/active_dark.webp';
export const metoniSocial = {
  url: social.src,
  width: social.width,
  height: social.height,
  type: 'image/webp',
  alt: 'Metoni: Workout Tracker, showing light and dark app screens.',
};

// Android captures supplied from rr-design/playstore. Screenshots retain their full aspect ratio.
export interface MetoniScreenshot {
  image: ImageMetadata;
  alt: string;
  caption: string;
}
export interface MetoniVideo {
  src: string;
  type: string;
  poster: ImageMetadata;
  captions?: string;
  description: string;
  transcript: string;
}
export const metoniMedia: {
  icon?: ImageMetadata;
  iconAlt: string;
  screenshots: MetoniScreenshot[];
  video?: MetoniVideo;
} = {
  icon,
  iconAlt: 'Metoni app icon',
  screenshots: [
    {
      image: logging,
      alt: 'Metoni Android workout log with recorded squat sets and an Apply Suggestion button.',
      caption: 'Record sets and confirm suggestions.',
    },
    {
      image: plans,
      alt: 'Metoni Android workout plans showing leg, shoulder, push and pull routines.',
      caption: 'Keep your workout plans ready.',
    },
    {
      image: rest,
      alt: 'Metoni Android active workout in dark mode with a rest countdown above exercise sets.',
      caption: 'Follow your rest timer between sets.',
    },
    {
      image: session,
      alt: 'Metoni Android completed session showing duration, volume, reps and the recorded sets.',
      caption: 'Review the details of a completed session.',
    },
    {
      image: home,
      alt: 'Metoni Android home screen in dark mode with weekly activity, plans and recent sessions.',
      caption: 'See recent activity in dark mode.',
    },
    {
      image: library,
      alt: 'Metoni Android exercise library with muscle-group filters and an Add Exercise button.',
      caption: 'Find exercises and add your own.',
    },
  ],
};
