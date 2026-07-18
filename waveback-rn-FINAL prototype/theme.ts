// Groove Decades brand palette + theme tokens
export const WB = {
  espresso: '#1C1410', plate: '#271D15', cream: '#F5EAD0',
  amber: '#E9A23B', burnt: '#D9652B', brick: '#C33D2E', berry: '#A93358',
} as const;

export type WavebackTheme = 'espresso' | 'cream';

export interface Tone {
  bg: string; ink: string; mut: string; dim: string; track: string;
  dot: string; plate: string; grain: number; bar: 'dark-content' | 'light-content';
}

// Dynamic colors stay in `style`; Tailwind handles layout
export const tone = (t: WavebackTheme): Tone =>
  t === 'cream'
    ? { bg: WB.cream, ink: WB.espresso, mut: 'rgba(28,20,16,0.6)', dim: 'rgba(28,20,16,0.45)',
        track: 'rgba(28,20,16,0.16)', dot: WB.espresso, plate: WB.espresso, grain: 0.085, bar: 'dark-content' }
    : { bg: WB.espresso, ink: WB.cream, mut: 'rgba(245,234,208,0.55)', dim: 'rgba(245,234,208,0.34)',
        track: 'rgba(245,234,208,0.13)', dot: WB.cream, plate: WB.plate, grain: 0.05, bar: 'light-content' };
