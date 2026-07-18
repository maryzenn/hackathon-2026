import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { WB, type EraId } from './wavebackTheme';

type Era = { id: EraId; label: string; sub: string };

type EraChipProps = {
  era: Era;
  active: boolean;
  plate: string;
  muted: string;
  onPress: () => void;
};

export function EraChip({ era, active, plate, muted, onPress }: EraChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center w-[106px] py-0.5"
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.93 : 1 }] })}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${era.label} era`}
    >
      <View className="w-[58px] h-[58px] rounded-full items-center justify-center" style={{ backgroundColor: plate }}>
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
        <EraGlyph id={era.id} color={active ? WB.espresso : muted} />
      </View>
      <Text className="font-display text-[10px] mt-[7px]" style={{ color: active ? WB.amber : muted, letterSpacing: 2 }}>
        {era.label}
      </Text>
      <Text className="font-sansbold text-[7.5px] mt-[4px]" style={{ color: 'rgba(160,140,120,0.6)', letterSpacing: 1.8 }}>
        {era.sub}
      </Text>
    </Pressable>
  );
}

function EraGlyph({ id, color }: { id: EraId; color: string }) {
  switch (id) {
    case 'CLEAN': return <Svg width={18} height={18} viewBox="0 0 18 18" fill={color}><Path d="M6.3 4.2 Q7.1 9 11.9 9.8 Q7.1 10.6 6.3 15.4 Q5.5 10.6 0.7 9.8 Q5.5 9 6.3 4.2 Z" /><Path d="M13.2 2.2 Q13.7 5.1 16.6 5.6 Q13.7 6.1 13.2 9 Q12.7 6.1 9.8 5.6 Q12.7 5.1 13.2 2.2 Z" /></Svg>;
    case 'MASTER': return <Svg width={18} height={18} viewBox="0 0 18 18" fill={color}><Path d="M9 0.9 Q10.2 7.8 17.1 9 Q10.2 10.2 9 17.1 Q7.8 10.2 0.9 9 Q7.8 7.8 9 0.9 Z" /></Svg>;
    case 'ULTRA': return <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><Path d="M2.2 7.2v3.6" /><Path d="M5.6 5.8v6.4" /><Path d="M9 4.4v9.2" /><Path d="M12.4 3v12" /><Path d="M15.8 1.5v15" /></Svg>;
    case 'VINYL': return <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color}><Circle cx={9} cy={9} r={6.8} strokeWidth={1.5} /><Circle cx={9} cy={9} r={2.9} strokeWidth={1.3} /><Circle cx={9} cy={9} r={0.9} fill={color} stroke="none" /></Svg>;
    case 'RADIO': return <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color} strokeLinecap="round"><Path d="M4.8 5.4 L8.6 1.6" strokeWidth={1.4} /><Rect x={1.6} y={5.4} width={14.8} height={9.4} rx={2} strokeWidth={1.5} /><Circle cx={6.1} cy={10.1} r={2.2} strokeWidth={1.3} /><Path d="M11.3 8.3h3.4" strokeWidth={1.3} /><Path d="M11.3 11.9h3.4" strokeWidth={1.3} /></Svg>;
    case 'CASSETTE': return <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color}><Rect x={1.4} y={4.6} width={15.2} height={9.2} rx={1.6} strokeWidth={1.5} /><Circle cx={6.3} cy={9.2} r={1.8} strokeWidth={1.2} /><Circle cx={11.7} cy={9.2} r={1.8} strokeWidth={1.2} /><Path d="M8.1 9.2h1.8" strokeWidth={1.2} /></Svg>;
  }
}
