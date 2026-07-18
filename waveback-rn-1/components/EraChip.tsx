import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { WB } from '../theme';
import { EraDef } from '../eras';
import Glyph from './Glyph';

export default function EraChip({ era, active, plate, mut, beatMs, playing, onPress }: {
  era: EraDef; active: boolean; plate: string; mut: string; beatMs: number; playing: boolean; onPress: () => void;
}) {
  // Past-era glyphs "play" while selected: vinyl spins, radio & cassette rock — to the song's BPM while music runs
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    if (!active || era.rank > 0) return;
    const duration = era.id === 'VINYL' ? (playing ? beatMs * 4 : 2400)
      : era.id === 'RADIO' ? (playing ? beatMs : 900)
      : (playing ? beatMs * 2 : 1200);
    const loop = Animated.loop(Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: era.id === 'VINYL' ? Easing.linear : Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [active, era.id, era.rank, beatMs, playing, anim]);
  const rotate = era.id === 'VINYL'
    ? anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
    : anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-7deg', '7deg', '-7deg'] });
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
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Glyph id={era.id} color={active ? WB.espresso : mut} />
        </Animated.View>
      </View>
      <Text className="font-display text-[10px] mt-[7px]"
        style={{ color: active ? WB.amber : mut, letterSpacing: 2 }}>{era.label}</Text>
      <Text className="font-sansbold text-[7.5px] mt-[4px]"
        style={{ color: 'rgba(160,140,120,0.6)', letterSpacing: 1.8 }}>{era.sub}</Text>
    </Pressable>
  );
}
