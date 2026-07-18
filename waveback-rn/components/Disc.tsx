import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { WB } from '../theme';

const RIPPLE_MS = 620;

// Groove rings, center outward: berry → brick → burnt → amber
const RINGS = [
  { r: 89,  w: 14, c: WB.berry },
  { r: 111, w: 14, c: WB.brick },
  { r: 133, w: 14, c: WB.burnt },
  { r: 156, w: 16, c: WB.amber },
];

export default function Disc({ size, bg, playing, processing, spinSeconds, rippleKey, rippleDir, cover, children }: {
  size: number; bg: string; playing: boolean; processing: boolean; spinSeconds: number;
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

  // Ripple — one-shot staggered scale pulse across the 4 rings (era change only)
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
        {/* Disc base blends into the screen background */}
        <Svg width={size} height={size} viewBox="0 0 340 340" style={{ position: 'absolute' }}>
          <Circle cx={170} cy={170} r={170} fill={bg} />
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
      {children /* non-rotating overlay */}
    </View>
  );
}
