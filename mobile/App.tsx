import { useEffect, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text } from 'react-native';
import './global.css';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { AnalysisCard } from './components/AnalysisCard';
import { EraSelectorCard } from './components/EraSelectorCard';
import { PlaybackCard } from './components/playbackCard';
import { UploadCard } from './components/UploadCard';
import { ERAS, type Analysis } from './components/types';
import { API_BASE } from './config';

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

        <UploadCard
          busy={busy}
          trackName={trackName}
          onUpload={pickAndUpload}
          onLoadDemo={loadDemo}
        />

        {trackId && (
          <>
            <EraSelectorCard
              eras={ERAS}
              selectedIndex={eraIndex}
              loading={eraLoading}
              onSelect={setEraIndex}
            />

            <PlaybackCard
              eraLabel={era.label}
              playing={status.playing}
              loading={eraLoading}
              currentTime={status.currentTime}
              duration={status.duration}
              canShare={canShare}
              onTogglePlayback={() => (status.playing ? player.pause() : player.play())}
              onShare={shareCurrent}
            />

            <AnalysisCard analysis={analysis} loading={analyzing} onAnalyze={runAnalysis} />
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
