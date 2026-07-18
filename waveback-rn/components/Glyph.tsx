import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { EraId } from '../eras';

// Era glyphs, tinted via `color`
export default function Glyph({ id, color }: { id: EraId; color: string }) {
  switch (id) {
    case 'CLEAN': return ( // broom, sweeping top-left → bottom-right
      <Svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke={color} strokeLinecap="round">
        <Path d="M1.9 1.9 L10.4 10.4" strokeWidth={1.6} />
        <Path d="M13.2 9.4 L9.4 13.2" strokeWidth={2.4} />
        <Path d="M12.9 10.6 L18.3 12.9" strokeWidth={1.5} />
        <Path d="M12.4 11.2 L17.7 14.8" strokeWidth={1.5} />
        <Path d="M11.9 11.9 L16.9 16.9" strokeWidth={1.5} />
        <Path d="M11.2 12.4 L14.8 17.7" strokeWidth={1.5} />
        <Path d="M10.6 12.9 L12.9 18.3" strokeWidth={1.5} />
      </Svg>);
    case 'MASTER': return ( // four-point star
      <Svg width={18} height={18} viewBox="0 0 18 18" fill={color}>
        <Path d="M9 0.9 Q10.2 7.8 17.1 9 Q10.2 10.2 9 17.1 Q7.8 10.2 0.9 9 Q7.8 7.8 9 0.9 Z" />
      </Svg>);
    case 'ULTRA': return ( // atomic synthesis core
      <Svg width={20} height={20} viewBox="0 0 18 18" fill="none" stroke={color}>
        <Ellipse cx={9} cy={9} rx={7.2} ry={2.9} transform="rotate(32 9 9)" strokeWidth={1.3} />
        <Ellipse cx={9} cy={9} rx={7.2} ry={2.9} transform="rotate(-32 9 9)" strokeWidth={1.3} />
        <Circle cx={9} cy={9} r={1.7} fill={color} stroke="none" />
        <Circle cx={15.1} cy={12.8} r={0.95} fill={color} stroke="none" />
        <Circle cx={2.9} cy={12.8} r={0.95} fill={color} stroke="none" />
      </Svg>);
    case 'VINYL': return ( // record with orbit dot so rotation reads
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke={color}>
        <Circle cx={9} cy={9} r={6.8} strokeWidth={1.5} />
        <Circle cx={9} cy={9} r={2.9} strokeWidth={1.3} />
        <Circle cx={9} cy={9} r={0.9} fill={color} stroke="none" />
        <Circle cx={9} cy={4.8} r={0.75} fill={color} stroke="none" />
      </Svg>);
    case 'RADIO': return ( // transistor radio
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
