import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Image, type ImageSourcePropType, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { WB } from './wavebackTheme';

const RINGS = [
  { r: 89, w: 14, c: WB.berry },
  { r: 111, w: 14, c: WB.brick },
  { r: 133, w: 14, c: WB.burnt },
  { r: 156, w: 16, c: WB.amber },
];

type RecordDiscProps = {
  size: number;
  playing: boolean;
  processing: boolean;
  spinSeconds: number;
  rippleKey: number;
  rippleDirection: 'in' | 'out';
  cover?: ImageSourcePropType;
  children?: ReactNode;
};

export function RecordDisc({ size, playing, processing, spinSeconds, rippleKey, rippleDirection, cover, children }: RecordDiscProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const angle = useRef(0);
  useEffect(() => {
    const subscription = spin.addListener(({ value }) => { angle.current = value; });
    return () => spin.removeListener(subscription);
  }, [spin]);
  useEffect(() => {
    if (!playing) return;
    const from = angle.current;
    spin.setValue(from);
    const loop = Animated.loop(Animated.timing(spin, { toValue: from + 1, duration: spinSeconds * 1000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [playing, spinSeconds, spin]);

  const ripples = useRef(RINGS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!rippleKey) return;
    ripples.forEach(value => value.setValue(0));
    const order = rippleDirection === 'out' ? [...ripples] : [...ripples].reverse();
    Animated.stagger(95, order.map(value => Animated.timing(value, { toValue: 1, duration: 620, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }))).start();
  }, [rippleKey, rippleDirection, ripples]);

  const pulse = useRef(new Animated.Value(0.12)).current;
  useEffect(() => {
    if (!processing) { pulse.setValue(0); return; }
    pulse.setValue(0.12);
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 0.92, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.12, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [processing, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const coverSize = size * (148 / 340);
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate }] }}>
        <Svg width={size} height={size} viewBox="0 0 340 340" style={{ position: 'absolute' }}><Circle cx={170} cy={170} r={170} fill={WB.espresso} /><Circle cx={170} cy={170} r={168.7} fill="none" stroke="rgba(245,234,208,0.09)" strokeWidth={1.4} /></Svg>
        {RINGS.map((ring, index) => <Animated.View key={ring.c} style={{ position: 'absolute', width: size, height: size, transform: [{ scale: ripples[index].interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.045, 1] }) }] }}><Svg width={size} height={size} viewBox="0 0 340 340"><Circle cx={170} cy={170} r={ring.r} fill="none" stroke={ring.c} strokeWidth={ring.w} /></Svg></Animated.View>)}
        {processing && <Animated.View style={{ position: 'absolute', width: size, height: size, opacity: pulse }}><Svg width={size} height={size} viewBox="0 0 340 340"><Circle cx={170} cy={170} r={156} fill="none" stroke={WB.amber} strokeWidth={18} /></Svg></Animated.View>}
        <View className="absolute inset-0 items-center justify-center"><View className="rounded-full overflow-hidden items-center justify-center" style={{ width: coverSize, height: coverSize, backgroundColor: WB.plate }}>{cover ? <Image source={cover} style={{ width: coverSize, height: coverSize }} resizeMode="cover" /> : <><View className="absolute inset-[6px] rounded-full border border-dashed" style={{ borderColor: 'rgba(245,234,208,0.25)' }} /><Text className="font-sansbold text-[8px]" style={{ color: 'rgba(245,234,208,0.4)', letterSpacing: 1.6 }}>COVER ART</Text></>}</View></View>
      </Animated.View>
      {children}
    </View>
  );
}
