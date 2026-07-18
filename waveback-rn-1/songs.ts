import { ImageSourcePropType } from 'react-native';

export interface Song { title: string; artist: string; dur: number; bpm?: number; cover?: ImageSourcePropType; }

export const SONGS: Song[] = [
  { title: 'Afterglow', artist: 'Vera & The Volts', dur: 222, bpm: 112, cover: require('./assets/label-0.png') },
  { title: 'Slow Motion Summer', artist: 'The Canyon Lights', dur: 258, bpm: 96, cover: require('./assets/label-1.png') },
  { title: 'Marigold', artist: 'Roman Holiday Radio', dur: 194, bpm: 132, cover: require('./assets/label-2.png') },
  { title: 'Dial Tone Dreams', artist: 'Peach Static', dur: 241, bpm: 104, cover: require('./assets/label-3.png') },
  { title: 'Golden Hour Getaway', artist: 'The Sundial Set', dur: 213, bpm: 118, cover: require('./assets/label-4.png') },
  { title: 'Rearview Bloom', artist: 'Cassette Motel', dur: 187, bpm: 88, cover: require('./assets/label-5.png') },
  { title: 'Static & Honey', artist: 'The Bakelites', dur: 229, bpm: 124, cover: require('./assets/label-6.png') },
  { title: 'Paper Moon Parade', artist: 'Dot & The Dashes', dur: 205, bpm: 108, cover: require('./assets/label-7.png') },
];

export const fmt = (x: number) => `${Math.floor(x / 60)}:${`${Math.floor(x % 60)}`.padStart(2, '0')}`;
