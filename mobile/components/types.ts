import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type EraKey = '1950s' | '1960s' | '1970s' | 'original' | 'modern';

export type Era = {
  key: EraKey;
  label: string;
  sub: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export type Analysis = {
  duration_s: number;
  tempo_bpm: number;
  energy: string;
  brightness_hz: number;
  key_guess: string;
  mood: string;
  note: string;
};

export const ERAS: Era[] = [
  { key: '1950s', label: '1950s', sub: 'Vinyl', icon: 'album' },
  { key: '1960s', label: '1960s', sub: 'AM radio', icon: 'radio' },
  { key: '1970s', label: '1970s', sub: 'Cassette', icon: 'cassette' },
  { key: 'original', label: 'Today', sub: 'Your file', icon: 'waveform' },
  { key: 'modern', label: 'Master', sub: 'AI restored', icon: 'star-four-points' },
];
