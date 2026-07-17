import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SectionCard } from './SectionCard';

type UploadCardProps = {
  busy: boolean;
  trackName: string;
  onUpload: () => void;
  onLoadDemo: () => void;
};

export function UploadCard({ busy, trackName, onUpload, onLoadDemo }: UploadCardProps) {
  return (
    <SectionCard>
      <View className="flex-row items-center gap-2.5">
        <Pressable
          className="flex-row items-center gap-1.5 rounded-[10px] bg-[#4fd8eb] px-4 py-2.5"
          onPress={onUpload}
          disabled={busy}
        >
          <MaterialCommunityIcons name="upload" size={18} color="#0b0e14" />
          <Text className="font-bold text-[#0b0e14]">Upload clip</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1.5 rounded-[10px] border border-[#4fd8eb] bg-transparent px-4 py-2.5"
          onPress={onLoadDemo}
          disabled={busy}
        >
          <Text className="font-semibold text-[#4fd8eb]">Demo clip</Text>
        </Pressable>
      </View>
      {busy && (
        <View className="mt-3">
          <ActivityIndicator color="#4fd8eb" />
        </View>
      )}
      {!!trackName && <Text className="mt-3 font-semibold text-[#4fd8eb]">{trackName}</Text>}
      <Text className="mt-2 text-[11px] text-[#8b94a8]">
        Your own or royalty-free recordings only.
      </Text>
    </SectionCard>
  );
}
