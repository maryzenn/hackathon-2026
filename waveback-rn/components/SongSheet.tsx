import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { WB, WavebackTheme, Tone } from '../theme';
import { Song, fmt } from '../songs';

export default function SongSheet({ visible, onClose, songs, songIdx, onPick, onAddSong, theme, T }: {
  visible: boolean; onClose: () => void;
  songs: Song[]; songIdx: number; onPick: (i: number) => void;
  onAddSong?: () => void; // wire to expo-document-picker in the app
  theme: WavebackTheme; T: Tone;
}) {
  const [query, setQuery] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1" style={{ backgroundColor: 'rgba(12,8,6,0.55)' }} onPress={onClose} />
      <View className="rounded-t-[28px] px-4 pt-[14px] pb-10"
        style={{ backgroundColor: theme === 'cream' ? '#EFE3C6' : '#241A13' }}>
        <View className="w-9 h-1 rounded-full self-center mb-3" style={{ backgroundColor: T.track }} />
        <Text className="font-display text-[11px] text-center mb-2.5" style={{ color: T.dim, letterSpacing: 3 }}>PICK A SONG</Text>
        <View className="flex-row items-center gap-2.5 mb-3">
          <View className="flex-1 flex-row items-center gap-2 h-10 rounded-full px-3.5"
            style={{ backgroundColor: theme === 'cream' ? 'rgba(28,20,16,0.08)' : 'rgba(245,234,208,0.08)' }}>
            <Svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke={T.mut} strokeWidth={1.6} strokeLinecap="round">
              <Circle cx={7} cy={7} r={4.6} /><Path d="M10.6 10.6 L14 14" />
            </Svg>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search songs"
              placeholderTextColor={T.dim} className="flex-1 font-sans text-[13px] p-0"
              style={{ color: T.ink }} />
          </View>
          <Pressable onPress={onAddSong} accessibilityRole="button" accessibilityLabel="Add audio file"
            className="w-10 h-10 rounded-full items-center justify-center"
            style={({ pressed }) => ({ backgroundColor: T.plate, borderWidth: 1.5, borderColor: 'rgba(233,162,59,0.5)', transform: [{ scale: pressed ? 0.92 : 1 }] })}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={WB.amber} strokeWidth={1.8} strokeLinecap="round">
              <Path d="M8 2.5v11" /><Path d="M2.5 8h11" />
            </Svg>
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
        {songs.map((sg, i) => ({ sg, i }))
          .filter(({ sg }) => !query.trim() || `${sg.title} ${sg.artist}`.toLowerCase().includes(query.trim().toLowerCase()))
          .map(({ sg, i }) => {
          const sel = i === songIdx;
          return (
            <Pressable key={sg.title} onPress={() => onPick(i)}
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
        </ScrollView>
      </View>
    </Modal>
  );
}
