import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, Image, ImageSourcePropType, LayoutChangeEvent,
  Modal, Pressable, StatusBar, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { EraChip as EraChipComponent } from './components/EraChip';
import { RecordDisc } from './components/RecordDisc';
import { WB, type EraId, type WavebackTheme } from './components/wavebackTheme';

// ─── Brand ────────────────────────────────────────────────────────────────
export { WB } from './components/wavebackTheme';
export type { EraId, WavebackTheme } from './components/wavebackTheme';

const RIPPLE_MS = 620;
const PROCESS_MS = 1700;

export interface Song { title: string; artist: string; dur: number; cover?: ImageSourcePropType; }
export const SONGS: Song[] = [
  { title: 'Afterglow', artist: 'Vera & The Volts', dur: 222, cover: require('./assets/label-0.png') },
  { title: 'Slow Motion Summer', artist: 'The Canyon Lights', dur: 258, cover: require('./assets/label-1.png') },
  { title: 'Marigold', artist: 'Roman Holiday Radio', dur: 194, cover: require('./assets/label-2.png') },
  { title: 'Dial Tone Dreams', artist: 'Peach Static', dur: 241, cover: require('./assets/label-3.png') },
];
const fmt = (x: number) => `${Math.floor(x / 60)}:${`${Math.floor(x % 60)}`.padStart(2, '0')}`;

interface EraDef { id: EraId; label: string; sub: string; pill: string; rank: number; }

const TIME_UP: EraDef[] = [
  { id: 'CLEAN',  label: 'CLEAN',  sub: 'DENOISED',    pill: 'CLEAN · DENOISED',    rank: 1 },
  { id: 'MASTER', label: 'MASTER', sub: 'AI RESTORED', pill: 'MASTER · AI RESTORED', rank: 2 },
  { id: 'ULTRA',  label: 'ULTRA',  sub: 'UPSCALED',    pill: 'ULTRA · UPSCALED',    rank: 3 },
];
const TIME_DOWN: EraDef[] = [
  { id: 'VINYL',    label: 'VINYL',    sub: '1950S', pill: 'VINYL · 1950S',    rank: -3 },
  { id: 'RADIO',    label: 'AM RADIO', sub: '1960S', pill: 'AM RADIO · 1960S', rank: -2 },
  { id: 'CASSETTE', label: 'CASSETTE', sub: '1970S', pill: 'CASSETTE · 1970S', rank: -1 },
];
const ALL_ERAS = [...TIME_UP, ...TIME_DOWN];
const rankOf = (id: EraId | null): number => (id ? ALL_ERAS.find(e => e.id === id)!.rank : 0);

// Theme tokens (dynamic colors stay in `style`; Tailwind handles layout)
const tone = (t: WavebackTheme) =>
  t === 'cream'
    ? { bg: WB.cream, ink: WB.espresso, mut: 'rgba(28,20,16,0.6)', dim: 'rgba(28,20,16,0.45)',
        track: 'rgba(28,20,16,0.16)', dot: WB.espresso, plate: WB.espresso, grain: 0.085, bar: 'dark-content' as const }
    : { bg: WB.espresso, ink: WB.cream, mut: 'rgba(245,234,208,0.55)', dim: 'rgba(245,234,208,0.34)',
        track: 'rgba(245,234,208,0.13)', dot: WB.cream, plate: WB.plate, grain: 0.05, bar: 'light-content' as const };

// ─── Era glyphs (18×18, currentColor via `color` prop) ────────────────────
function Glyph({ id, color }: { id: EraId; color: string }) {
  switch (id) {
    case 'CLEAN': return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill={color}>
        <Path d="M6.3 4.2 Q7.1 9 11.9 9.8 Q7.1 10.6 6.3 15.4 Q5.5 10.6 0.7 9.8 Q5.5 9 6.3 4.2 Z" />
        <Path d="M13.2 2.2 Q13.7 5.1 16.6 5.6 Q13.7 6.1 13.2 9 Q12.7 6.1 9.8 5.6 Q12.7 5.1 13.2 2.2 Z" />
      </Svg>);
    case 'MASTER': return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill={color}>
        <Path d="M9 0.9 Q10.2 7.8 17.1 9 Q10.2 10.2 9 17.1 Q7.8 10.2 0.9 9 Q7.8 7.8 9 0.9 Z" />
      </Svg>);
    case 'ULTRA': return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
        <Path d="M2.2 7.2v3.6" /><Path d="M5.6 5.8v6.4" /><Path d="M9 4.4v9.2" />
        <Path d="M12.4 3v12" /><Path d="M15.8 1.5v15" />
      </Svg>);
    case 'VINYL': return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color}>
        <Circle cx={9} cy={9} r={6.8} strokeWidth={1.5} />
        <Circle cx={9} cy={9} r={2.9} strokeWidth={1.3} />
        <Circle cx={9} cy={9} r={0.9} fill={color} stroke="none" />
      </Svg>);
    case 'RADIO': return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color} strokeLinecap="round">
        <Path d="M4.8 5.4 L8.6 1.6" strokeWidth={1.4} />
        <Rect x={1.6} y={5.4} width={14.8} height={9.4} rx={2} strokeWidth={1.5} />
        <Circle cx={6.1} cy={10.1} r={2.2} strokeWidth={1.3} />
        <Path d="M11.3 8.3h3.4" strokeWidth={1.3} /><Path d="M11.3 11.9h3.4" strokeWidth={1.3} />
      </Svg>);
    case 'CASSETTE': return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color}>
        <Rect x={1.4} y={4.6} width={15.2} height={9.2} rx={1.6} strokeWidth={1.5} />
        <Circle cx={6.3} cy={9.2} r={1.8} strokeWidth={1.2} />
        <Circle cx={11.7} cy={9.2} r={1.8} strokeWidth={1.2} />
        <Path d="M8.1 9.2h1.8" strokeWidth={1.2} />
      </Svg>);
  }
}

// ─── Era chip ─────────────────────────────────────────────────────────────
function EraChip({ era, active, plate, mut, onPress }: {
  era: EraDef; active: boolean; plate: string; mut: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center w-[106px] py-0.5"
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.93 : 1 }] })}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${era.label} era`}
    >
      <View className="w-[58px] h-[58px] rounded-full items-center justify-center"
        style={{ backgroundColor: plate }}>
        <Svg width={58} height={58} viewBox="0 0 58 58" style={{ position: 'absolute' }}>
          {active ? (
            <>
              <Circle cx={29} cy={29} r={27} stroke={WB.amber} strokeWidth={2} fill="none" />
              <Circle cx={29} cy={29} r={23} stroke={WB.burnt} strokeWidth={2} fill="none" />
              <Circle cx={29} cy={29} r={19} stroke={WB.brick} strokeWidth={2} fill="none" />
              <Circle cx={29} cy={29} r={15} stroke={WB.berry} strokeWidth={2} fill="none" />
              <Circle cx={29} cy={29} r={13} fill={WB.cream} />
            </>
          ) : (
            <Circle cx={29} cy={29} r={27} stroke="rgba(245,234,208,0.22)" strokeWidth={2} fill="none" />
          )}
        </Svg>
        <Glyph id={era.id} color={active ? WB.espresso : mut} />
      </View>
      <Text className="font-display text-[10px] mt-[7px]"
        style={{ color: active ? WB.amber : mut, letterSpacing: 2 }}>{era.label}</Text>
      <Text className="font-sansbold text-[7.5px] mt-[4px]"
        style={{ color: 'rgba(160,140,120,0.6)', letterSpacing: 1.8 }}>{era.sub}</Text>
    </Pressable>
  );
}

// ─── Disc (rings + ripple + processing pulse + rotation) ──────────────────
const RINGS = [
  { r: 89,  w: 14, c: WB.berry },
  { r: 111, w: 14, c: WB.brick },
  { r: 133, w: 14, c: WB.burnt },
  { r: 156, w: 16, c: WB.amber },
];

function Disc({ size, playing, processing, spinSeconds, rippleKey, rippleDir, cover, children }: {
  size: number; playing: boolean; processing: boolean; spinSeconds: number;
  rippleKey: number; rippleDir: 'in' | 'out';
  cover?: ImageSourcePropType; children?: React.ReactNode;
}) {
  // Rotation — resumes from current angle on play/pause
  const spin = useRef(new Animated.Value(0)).current;
  const angle = useRef(0);
  useEffect(() => {
    const sub = spin.addListener(({ value }) => { angle.current = value; });
    return () => spin.removeListener(sub);
  }, [spin]);
  useEffect(() => {
    if (!playing) return;
    const from = angle.current;
    spin.setValue(from);
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: from + 1, duration: spinSeconds * 1000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [playing, spinSeconds, spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Ripple — staggered scale pulse across the 4 rings
  const ripples = useRef(RINGS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!rippleKey) return;
    ripples.forEach(v => v.setValue(0));
    const order = rippleDir === 'out' ? [...ripples] : [...ripples].reverse(); // out: inner→outer
    Animated.stagger(95, order.map(v =>
      Animated.timing(v, { toValue: 1, duration: RIPPLE_MS, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true })
    )).start();
  }, [rippleKey, rippleDir, ripples]);

  // Processing pulse on the outermost ring
  const pulse = useRef(new Animated.Value(0.12)).current;
  useEffect(() => {
    if (!processing) { pulse.setValue(0); return; }
    pulse.setValue(0.12);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.92, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.12, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [processing, pulse]);

  const coverSize = size * (148 / 340);
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate }] }}>
        {/* Disc + rim */}
        <Svg width={size} height={size} viewBox="0 0 340 340" style={{ position: 'absolute' }}>
          <Circle cx={170} cy={170} r={170} fill={WB.espresso} />
          <Circle cx={170} cy={170} r={168.7} fill="none" stroke="rgba(245,234,208,0.09)" strokeWidth={1.4} />
        </Svg>
        {/* Groove rings — each in its own layer so it can ripple independently */}
        {RINGS.map((g, i) => (
          <Animated.View key={g.c} style={{
            position: 'absolute', width: size, height: size,
            transform: [{ scale: ripples[i].interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.045, 1] }) }],
          }}>
            <Svg width={size} height={size} viewBox="0 0 340 340">
              <Circle cx={170} cy={170} r={g.r} fill="none" stroke={g.c} strokeWidth={g.w} />
            </Svg>
          </Animated.View>
        ))}
        {processing && (
          <Animated.View style={{ position: 'absolute', width: size, height: size, opacity: pulse }}>
            <Svg width={size} height={size} viewBox="0 0 340 340">
              <Circle cx={170} cy={170} r={156} fill="none" stroke={WB.amber} strokeWidth={18} />
            </Svg>
          </Animated.View>
        )}
        {/* Cover art = record label */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="rounded-full overflow-hidden items-center justify-center"
            style={{ width: coverSize, height: coverSize, backgroundColor: WB.plate }}>
            {cover ? (
              <Image source={cover} style={{ width: coverSize, height: coverSize }} resizeMode="cover" />
            ) : (
              <>
                <View className="absolute inset-[6px] rounded-full border border-dashed"
                  style={{ borderColor: 'rgba(245,234,208,0.25)' }} />
                <Text className="font-sansbold text-[8px]"
                  style={{ color: 'rgba(245,234,208,0.4)', letterSpacing: 1.6 }}>COVER ART</Text>
              </>
            )}
          </View>
        </View>
      </Animated.View>
      {children /* non-rotating overlay (play button) */}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────
export interface WavebackScreenProps {
  theme?: WavebackTheme;
  spinSeconds?: number;
  songs?: Song[];
  cover?: ImageSourcePropType;
  grainTexture?: ImageSourcePropType; // optional tiling noise PNG
  initialEra?: EraId | null;
}

export default function WavebackScreen({
  theme = 'espresso', spinSeconds = 10, songs = SONGS,
  cover, grainTexture, initialEra = 'MASTER',
}: WavebackScreenProps) {
  const T = tone(theme);
  const [era, setEra] = useState<EraId | null>(initialEra);
  const [playing, setPlaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [t, setT] = useState(47);
  const [songIdx, setSongIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ripple, setRipple] = useState(0);
  const [dir, setDir] = useState<'in' | 'out'>('in');
  const [trackW, setTrackW] = useState(0);
  const procTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const song = songs[songIdx];
  const dur = song.dur;

  // Playback clock
  useEffect(() => {
    if (!playing || processing) return;
    const iv = setInterval(() => setT(prev => {
      const nt = Math.min(dur, prev + 0.25);
      if (nt >= dur) setPlaying(false);
      return nt;
    }), 250);
    return () => clearInterval(iv);
  }, [playing, processing, dur]);
  useEffect(() => () => clearTimeout(procTimer.current), []);

  const pick = (id: EraId) => {
    const next = era === id ? null : id;
    if (rankOf(next) === rankOf(era)) return;
    setDir(rankOf(next) < rankOf(era) ? 'out' : 'in'); // down in time → outward
    setEra(next);
    setProcessing(true);
    setRipple(n => n + 1);
    clearTimeout(procTimer.current);
    procTimer.current = setTimeout(() => setProcessing(false), PROCESS_MS);
  };

  const togglePlay = () => setPlaying(p => { if (!p && t >= dur) setT(0); return !p; });
  const pickSong = (i: number) => { setSongIdx(i); setT(0); setSheetOpen(false); };

  const pillText = processing
    ? (era ? (dir === 'out' ? 'REWINDING…' : 'RESTORING…') : 'RETURNING…')
    : (era ? ALL_ERAS.find(e => e.id === era)!.pill : 'ORIGINAL · TODAY');
  const lit = processing || era !== null;
  const pct = t / dur;

  const blink = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    if (!processing) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 0.25, duration: 400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [processing, blink]);

  const Hairline = useMemo(() => () => (
    <View className="flex-1 h-px" style={{ backgroundColor: T.track }} />
  ), [T.track]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: T.bg }}>
      <StatusBar barStyle={T.bar} />
      <View className="flex-1 pb-1">
        {/* Wordmark + song picker */}
        <View className="mt-2 items-center justify-center">
          <Text className="font-display text-[13.5px] text-center"
            style={{ color: T.ink, letterSpacing: 5.7 }}>WAVEBACK</Text>
          <Pressable
            onPress={() => setSheetOpen(true)}
            className="absolute right-[18px] w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: T.plate, borderWidth: 1.5, borderColor: 'rgba(245,234,208,0.22)',
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}
            accessibilityRole="button"
            accessibilityLabel="Pick a song"
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={T.mut} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5.6 12.6 V3.8 L13 2.4 V11.2" />
              <Circle cx={3.7} cy={12.6} r={1.9} fill={T.mut} stroke="none" />
              <Circle cx={11.1} cy={11.2} r={1.9} fill={T.mut} stroke="none" />
            </Svg>
          </Pressable>
        </View>

        {/* TIME UP */}
        <View className="flex-row items-center gap-3 mx-[30px] mt-[15px] mb-[11px]">
          <Hairline />
          <Text className="font-sansbold text-[8.5px]" style={{ color: T.dim, letterSpacing: 2.5 }}>TIME UP ↑</Text>
          <Hairline />
        </View>
        <View className="flex-row justify-center gap-3 px-4">
          {TIME_UP.map(e => (
            <EraChipComponent key={e.id} era={e} active={era === e.id} plate={T.plate} muted={T.mut} onPress={() => pick(e.id)} />
          ))}
        </View>

        {/* Player */}
        <View className="flex-1 items-center justify-center gap-[15px]">
          <RecordDisc size={300} playing={playing} processing={processing} spinSeconds={spinSeconds}
            rippleKey={ripple} rippleDirection={dir} cover={cover ?? song.cover}>
            <Pressable
              onPress={togglePlay}
              className="absolute w-14 h-14 rounded-full items-center justify-center"
              style={({ pressed }) => ({
                left: 150 - 28, top: 150 - 28, backgroundColor: WB.cream,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
              })}
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Pause' : 'Play'}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20">
                {playing ? (
                  <>
                    <Rect x={5.6} y={4.6} width={3.1} height={10.8} rx={1} fill={WB.espresso} />
                    <Rect x={11.3} y={4.6} width={3.1} height={10.8} rx={1} fill={WB.espresso} />
                  </>
                ) : (
                  <Path d="M7.2 4.6 L15.4 10 L7.2 15.4 Z" fill={WB.espresso} />
                )}
              </Svg>
            </Pressable>
          </RecordDisc>

          <View className="items-center px-[30px]">
            <Text className="font-display text-[21px]" style={{ color: T.ink }}>{song.title}</Text>
            <Text className="font-sansbold text-[12.5px] mt-[3px]" style={{ color: T.mut, letterSpacing: 0.5 }}>{song.artist}</Text>
            <View className="flex-row items-center gap-[7px] mt-[9px] px-[13px] py-[5px] rounded-full border"
              style={{ borderColor: lit ? 'rgba(233,162,59,0.4)' : T.track }}>
              {processing && (
                <Animated.View className="w-[5px] h-[5px] rounded-full"
                  style={{ backgroundColor: WB.amber, opacity: blink }} />
              )}
              <Text className="font-sansbold text-[8.5px]"
                style={{ color: lit ? WB.amber : T.mut, letterSpacing: 2.2 }}>{pillText}</Text>
            </View>
          </View>
        </View>

        {/* Timeline groove */}
        <View className="px-10 mt-[6px]">
          <Pressable className="h-6 justify-center"
            onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
            onPress={e => trackW && setT(Math.max(0, Math.min(1, e.nativeEvent.locationX / trackW)) * dur)}
          >
            <View className="h-[5px] rounded-[3px]" style={{ backgroundColor: T.track }} />
            <View className="absolute h-[5px] rounded-l-[3px]"
              style={{ width: trackW * pct, backgroundColor: WB.amber,
                shadowColor: WB.amber, shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }} />
            <View className="absolute w-3 h-3 rounded-full"
              style={{ left: Math.max(0, trackW * pct - 6), backgroundColor: T.dot,
                shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 }} />
          </Pressable>
          <View className="flex-row justify-between mt-px">
            <Text className="font-sansbold text-[9.5px]" style={{ color: T.mut, letterSpacing: 0.8 }}>{fmt(t)}</Text>
            <Text className="font-sansbold text-[9.5px]" style={{ color: T.mut, letterSpacing: 0.8 }}>{fmt(dur)}</Text>
          </View>
        </View>

        {/* TIME DOWN */}
        <View className="flex-row justify-center gap-3 px-4 mt-3">
          {TIME_DOWN.map(e => (
            <EraChipComponent key={e.id} era={e} active={era === e.id} plate={T.plate} muted={T.mut} onPress={() => pick(e.id)} />
          ))}
        </View>
        <View className="flex-row items-center gap-3 mx-[30px] mt-[11px]">
          <Hairline />
          <Text className="font-sansbold text-[8.5px]" style={{ color: T.dim, letterSpacing: 2.5 }}>TIME DOWN ↓</Text>
          <Hairline />
        </View>

        <Text className="font-sans text-[9px] text-center mt-[11px] px-11" style={{ color: T.dim, letterSpacing: 0.4 }}>
          Past eras: signal physics. Restoration: AI.
        </Text>
      </View>

      {grainTexture && (
        <Image source={grainTexture} resizeMode="repeat"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: T.grain }} />
      )}

      {/* Song picker sheet */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable className="flex-1" style={{ backgroundColor: 'rgba(12,8,6,0.55)' }} onPress={() => setSheetOpen(false)} />
        <View className="rounded-t-[28px] px-4 pt-[14px] pb-10"
          style={{ backgroundColor: theme === 'cream' ? '#EFE3C6' : '#241A13' }}>
          <View className="w-9 h-1 rounded-full self-center mb-3" style={{ backgroundColor: T.track }} />
          <Text className="font-display text-[11px] text-center mb-2.5" style={{ color: T.dim, letterSpacing: 3 }}>PICK A SONG</Text>
          {songs.map((sg, i) => {
            const sel = i === songIdx;
            return (
              <Pressable key={sg.title} onPress={() => pickSong(i)}
                className="flex-row items-center gap-3 px-2.5 py-[10px] rounded-2xl"
                style={{ backgroundColor: sel ? 'rgba(233,162,59,0.12)' : 'transparent' }}
                accessibilityRole="button" accessibilityState={{ selected: sel }}
              >
                <View className="w-[34px] h-[34px] rounded-full overflow-hidden"
                  style={{ borderWidth: sel ? 2 : 1, borderColor: sel ? WB.amber : 'rgba(245,234,208,0.25)', backgroundColor: WB.espresso }}>
                  {sg.cover && <Image source={sg.cover} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
                </View>
                <View className="flex-1">
                  <Text className="font-display text-[13px]" style={{ color: theme === 'cream' ? WB.espresso : WB.cream }}>{sg.title}</Text>
                  <Text className="font-sansbold text-[10.5px] mt-0.5" style={{ color: T.mut }}>{sg.artist}</Text>
                </View>
                <Text className="font-sansbold text-[10px]" style={{ color: sel ? WB.amber : T.mut }}>{fmt(sg.dur)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
