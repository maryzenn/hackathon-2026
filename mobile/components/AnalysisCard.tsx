import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SectionCard } from './SectionCard';
import type { Analysis } from './types';

type AnalysisCardProps = {
  analysis: Analysis | null;
  loading: boolean;
  onAnalyze: () => void;
};

export function AnalysisCard({ analysis, loading, onAnalyze }: AnalysisCardProps) {
  return (
    <SectionCard>
      {analysis ? (
        <>
          <Text className="mb-2.5 text-[11px] tracking-[2px] text-[#8b94a8]">ANALYSIS</Text>
          <View className="mb-2.5 flex-row">
            <Stat label="Tempo" value={`${analysis.tempo_bpm} bpm`} />
            <Stat label="Energy" value={analysis.energy} />
            <Stat label="Mood" value={analysis.mood} />
          </View>
          <View className="mb-2.5 flex-row">
            <Stat label="Brightness" value={`${analysis.brightness_hz} Hz`} />
            <Stat label="Key (rough)" value={analysis.key_guess} />
            <Stat label="Length" value={`${analysis.duration_s}s`} />
          </View>
          <Text className="mt-2 text-[11px] text-[#8b94a8]">{analysis.note}</Text>
        </>
      ) : (
        <Pressable
          className="flex-row items-center gap-1.5 self-start rounded-[10px] border border-[#4fd8eb] bg-transparent px-4 py-2.5"
          onPress={onAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#4fd8eb" />
          ) : (
            <Text className="font-semibold text-[#4fd8eb]">Analyze tempo &amp; mood (librosa)</Text>
          )}
        </Pressable>
      )}
    </SectionCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[15px] font-bold capitalize text-[#e8ecf4]">{value}</Text>
      <Text className="mt-0.5 text-[10px] text-[#8b94a8]">{label}</Text>
    </View>
  );
}
