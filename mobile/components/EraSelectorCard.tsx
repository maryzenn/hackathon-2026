import { Pressable, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SectionCard } from './SectionCard';
import type { Era } from './types';

type EraSelectorCardProps = {
  eras: Era[];
  selectedIndex: number;
  loading: boolean;
  onSelect: (index: number) => void;
};

export function EraSelectorCard({ eras, selectedIndex, loading, onSelect }: EraSelectorCardProps) {
  const era = eras[selectedIndex];

  return (
    <SectionCard>
      <View className="mb-2 flex-row justify-between">
        {eras.map((item, index) => (
          <Pressable
            key={item.key}
            className="flex-1 items-center py-1"
            onPress={() => onSelect(index)}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={30}
              color={index === selectedIndex ? '#4fd8eb' : '#5a6478'}
            />
            <Text
              className={`mt-1 text-xs font-bold ${index === selectedIndex ? 'text-[#4fd8eb]' : 'text-[#8b94a8]'}`}
            >
              {item.label}
            </Text>
            <Text className="text-[9px] text-[#5a6478]">{item.sub}</Text>
          </Pressable>
        ))}
      </View>
      <Slider
        minimumValue={0}
        maximumValue={eras.length - 1}
        step={1}
        value={selectedIndex}
        onSlidingComplete={(value: number) => onSelect(Math.round(value))}
        minimumTrackTintColor="#f5b453"
        maximumTrackTintColor="#4fd8eb"
        thumbTintColor="#e8ecf4"
      />
      <Text className="mt-1.5 text-center text-xs text-[#8b94a8]">
        {loading
          ? era.key === 'modern'
            ? 'Running DeepFilterNet on CPU…'
            : `Rebuilding ${era.label} playback physics…`
          : `${era.label} · ${era.sub}`}
      </Text>
    </SectionCard>
  );
}
