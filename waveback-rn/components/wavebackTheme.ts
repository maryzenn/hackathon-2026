export const WB = {
  espresso: '#1C1410',
  plate: '#271D15',
  cream: '#F5EAD0',
  amber: '#E9A23B',
  burnt: '#D9652B',
  brick: '#C33D2E',
  berry: '#A93358',
} as const;

export type EraId = 'CLEAN' | 'MASTER' | 'ULTRA' | 'VINYL' | 'RADIO' | 'CASSETTE';
export type WavebackTheme = 'espresso' | 'cream';
