import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import './global.css';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { SectionCard } from './components/SectionCard';
import { API_BASE } from './config';

type EraKey = '1950s' | '1960s' | '1970s' | 'original' | 'modern';
type Era = {
  key: EraKey;
  label: string;
  sub: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const ERAS: Era[] = [
  { key: '1950s', label: '1950s', sub: 'Vinyl', icon: 'album' },
  { key: '1960s', label: '1960s', sub: 'AM radio', icon: 'radio' },
  { key: '1970s', label: '1970s', sub: 'Cassette', icon: 'cassette' },
  { key: 'original', label: 'Today', sub: 'Your file', icon: 'waveform' },
  { key: 'modern', label: 'Master', sub: 'AI restored', icon: 'star-four-points' },
];

type Analysis = {
  duration_s: number;
  tempo_bpm: number;
  energy: string;
  brightness_hz: number;
  key_guess: string;
  mood: string;
  note: string;
};

export default function App() {
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackName, setTrackName] = useState('');
  const [eraIndex, setEraIndex] = useState(3);
  const [eraLoading, setEraLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const era = ERAS[eraIndex];

  useEffect(() => {
    if (!trackId) return;
    let cancelled = false;
    (async () => {
      setEraLoading(true);
      setError('');
      try {
        const url = `${API_BASE}/api/audio/${trackId}/${era.key}`;
        const r = await fetch(url); // renders + caches server-side, surfaces errors
        if (!r.ok) throw new Error((await r.json()).detail ?? 'Processing failed');
        if (cancelled) return;
        player.replace({ uri: url });
      } catch (e: any) {
        if (!cancelled) setError(String(e.message ?? e));
      } finally {
        if (!cancelled) setEraLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackId, era.key]);

  async function startTrack(res: Response, name: string) {
    if (!res.ok) throw new Error((await res.json()).detail ?? 'Upload failed');
    const j = await res.json();
    setAnalysis(null);
    setEraIndex(3);
    setTrackName(`${name} — ${j.duration.toFixed(1)}s`);
    setTrackId(j.id);
  }

  async function loadDemo() {
    setBusy(true);
    setError('');
    try {
      await startTrack(await fetch(`${API_BASE}/api/demo`, { method: 'POST' }), 'Demo clip');
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function pickAndUpload() {
    setError('');
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.length) return;
    const asset = picked.assets[0];
    setBusy(true);
    try {
      const fd = new FormData();
      if (Platform.OS === 'web' && asset.file) {
        fd.append('file', asset.file, asset.name);
      } else {
        fd.append('file', {
          uri: asset.uri,
          name: asset.name ?? 'upload.wav',
          type: asset.mimeType ?? 'audio/wav',
        } as any);
      }
      await startTrack(
        await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd }),
        asset.name ?? 'Upload',
      );
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis() {
    if (!trackId) return;
    setAnalyzing(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/analyze/${trackId}`);
      if (!r.ok) throw new Error((await r.json()).detail ?? 'Analysis failed');
      setAnalysis(await r.json());
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function shareCurrent() {
    if (!trackId) return;
    try {
      const { File, Paths } = await import('expo-file-system');
      const dest = new File(Paths.cache, `waveback-${era.key}.wav`);
      if (dest.exists) dest.delete();
      const saved = await File.downloadFileAsync(
        `${API_BASE}/api/audio/${trackId}/${era.key}`,
        dest,
      );
      await Sharing.shareAsync(saved.uri, { mimeType: 'audio/wav' });
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  const canShare = Platform.OS !== 'web';

  return (
    <SafeAreaView className="flex-1 bg-[#0b0e14]">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerClassName="w-full max-w-[560px] self-center px-[18px] pb-12">
        <Text className="mt-2 text-center text-[34px] font-extrabold tracking-[6px]">
          <Text className="text-[#4fd8eb]">WAVE</Text>
          <Text className="text-[#f5b453]">BACK</Text>
        </Text>
        <Text className="mt-1 mb-4 text-center text-[11px] tracking-[1.5px] text-[#8b94a8]">ONE SLIDER · SEVENTY YEARS OF SOUND</Text>

        <SectionCard>
          <View className="flex-row items-center gap-2.5">
            <Pressable className="flex-row items-center gap-1.5 rounded-[10px] bg-[#4fd8eb] px-4 py-2.5" onPress={pickAndUpload} disabled={busy}>
              <MaterialCommunityIcons name="upload" size={18} color="#0b0e14" />
              <Text className="font-bold text-[#0b0e14]">Upload clip</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-1.5 rounded-[10px] border border-[#4fd8eb] bg-transparent px-4 py-2.5" onPress={loadDemo} disabled={busy}>
              <Text className="font-semibold text-[#4fd8eb]">Demo clip</Text>
            </Pressable>
          </View>
          {busy && (
            <View className="mt-3">
              <ActivityIndicator color="#4fd8eb" />
            </View>
          )}
          {!!trackName && <Text className="mt-3 font-semibold text-[#4fd8eb]">{trackName}</Text>}
          <Text className="mt-2 text-[11px] text-[#8b94a8]">Your own or royalty-free recordings only.</Text>
        </SectionCard>

        {trackId && (
          <>
            <SectionCard>
              <View className="mb-2 flex-row justify-between">
                {ERAS.map((e, i) => (
                  <Pressable key={e.key} className="flex-1 items-center py-1" onPress={() => setEraIndex(i)}>
                    <MaterialCommunityIcons
                      name={e.icon}
                      size={30}
                      color={i === eraIndex ? '#4fd8eb' : '#5a6478'}
                    />
                    <Text className={`mt-1 text-xs font-bold ${i === eraIndex ? 'text-[#4fd8eb]' : 'text-[#8b94a8]'}`}>{e.label}</Text>
                    <Text className="text-[9px] text-[#5a6478]">{e.sub}</Text>
                  </Pressable>
                ))}
              </View>
              <Slider
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={eraIndex}
                onSlidingComplete={(v: number) => setEraIndex(Math.round(v))}
                minimumTrackTintColor="#f5b453"
                maximumTrackTintColor="#4fd8eb"
                thumbTintColor="#e8ecf4"
              />
              <Text className="mt-1.5 text-center text-xs text-[#8b94a8]">
                {eraLoading
                  ? era.key === 'modern'
                    ? 'Running DeepFilterNet on CPU…'
                    : `Rebuilding ${era.label} playback physics…`
                  : `${era.label} · ${era.sub}`}
              </Text>
            </SectionCard>

            <SectionCard>
              <View className="flex-row items-center gap-2.5">
                <Pressable
                  className="h-14 w-14 items-center justify-center rounded-full bg-[#4fd8eb]"
                  onPress={() => (status.playing ? player.pause() : player.play())}
                  disabled={eraLoading}
                >
                  {eraLoading ? (
                    <ActivityIndicator color="#0b0e14" />
                  ) : (
                    <MaterialCommunityIcons
                      name={status.playing ? 'pause' : 'play'}
                      size={30}
                      color="#0b0e14"
                    />
                  )}
                </Pressable>
                <View className="ml-[14px] flex-1">
                  <Text className="font-semibold text-[#e8ecf4]">
                    {status.playing ? 'Playing' : 'Paused'} — {era.label}
                  </Text>
                  <Text className="mt-0.5 text-xs text-[#8b94a8]">
                    {fmt(status.currentTime)} / {fmt(status.duration)}
                  </Text>
                </View>
                {canShare && (
                  <Pressable className="flex-row items-center gap-1.5 rounded-[10px] border border-[#4fd8eb] bg-transparent px-4 py-2.5" onPress={shareCurrent}>
                    <MaterialCommunityIcons name="share-variant" size={16} color="#4fd8eb" />
                    <Text className="font-semibold text-[#4fd8eb]"> Share</Text>
                  </Pressable>
                )}
              </View>
            </SectionCard>

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
                <Pressable className="flex-row items-center gap-1.5 self-start rounded-[10px] border border-[#4fd8eb] bg-transparent px-4 py-2.5" onPress={runAnalysis} disabled={analyzing}>
                  {analyzing ? (
                    <ActivityIndicator color="#4fd8eb" />
                  ) : (
                    <Text className="font-semibold text-[#4fd8eb]">Analyze tempo &amp; mood (librosa)</Text>
                  )}
                </Pressable>
              )}
            </SectionCard>
          </>
        )}

        {!!error && <Text className="mb-2.5 text-center text-[#e77]">⚠ {error}</Text>}

        <Text className="mt-2 text-center text-[11px] leading-[17px] text-[#5a6478]">
          Past eras are physical signal modeling — no AI. The modern master is DeepFilterNet
          denoising, pretrained inference on CPU.
        </Text>
      </ScrollView>
    </SafeAreaView>
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

function fmt(sec: number | undefined) {
  const v = Math.max(0, Math.floor(sec ?? 0));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
}
