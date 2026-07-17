import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SectionCard } from './SectionCard';

type PlaybackCardProps = {
  eraLabel: string;
  playing: boolean;
  loading: boolean;
  currentTime?: number;
  duration?: number;
  canShare: boolean;
  onTogglePlayback: () => void;
  onShare: () => void;
};

export function PlaybackCard({
  eraLabel,
  playing,
  loading,
  currentTime,
  duration,
  canShare,
  onTogglePlayback,
  onShare,
}: PlaybackCardProps) {
  return (
    <SectionCard>
      <View className="flex-row items-center gap-2.5">
        <Pressable
          className="h-14 w-14 items-center justify-center rounded-full bg-[#4fd8eb]"
          onPress={onTogglePlayback}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0e14" />
          ) : (
            <MaterialCommunityIcons name={playing ? 'pause' : 'play'} size={30} color="#0b0e14" />
          )}
        </Pressable>

        <View className="ml-[14px] flex-1">
          <Text className="font-semibold text-[#e8ecf4]">
            {playing ? 'Playing' : 'Paused'} — {eraLabel}
          </Text>
          <Text className="mt-0.5 text-xs text-[#8b94a8]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        {canShare && (
          <Pressable
            className="flex-row items-center gap-1.5 rounded-[10px] border border-[#4fd8eb] bg-transparent px-4 py-2.5"
            onPress={onShare}
          >
            <MaterialCommunityIcons name="share-variant" size={16} color="#4fd8eb" />
            <Text className="font-semibold text-[#4fd8eb]">Share</Text>
          </Pressable>
        )}
      </View>
    </SectionCard>
  );
}

function formatTime(seconds: number | undefined) {
  const value = Math.max(0, Math.floor(seconds ?? 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
