import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
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
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>
          <Text style={s.titleWave}>WAVE</Text>
          <Text style={s.titleBack}>BACK</Text>
        </Text>
        <Text style={s.tagline}>ONE SLIDER · SEVENTY YEARS OF SOUND</Text>

        <View style={s.card}>
          <View style={s.row}>
            <Pressable style={s.btn} onPress={pickAndUpload} disabled={busy}>
              <MaterialCommunityIcons name="upload" size={18} color="#0b0e14" />
              <Text style={s.btnText}>Upload clip</Text>
            </Pressable>
            <Pressable style={[s.btn, s.btnGhost]} onPress={loadDemo} disabled={busy}>
              <Text style={s.btnGhostText}>Demo clip</Text>
            </Pressable>
          </View>
          {busy && <ActivityIndicator style={{ marginTop: 12 }} color="#4fd8eb" />}
          {!!trackName && <Text style={s.trackName}>{trackName}</Text>}
          <Text style={s.hint}>Your own or royalty-free recordings only.</Text>
        </View>

        {trackId && (
          <>
            <View style={s.card}>
              <View style={s.stops}>
                {ERAS.map((e, i) => (
                  <Pressable key={e.key} style={s.stop} onPress={() => setEraIndex(i)}>
                    <MaterialCommunityIcons
                      name={e.icon}
                      size={30}
                      color={i === eraIndex ? '#4fd8eb' : '#5a6478'}
                    />
                    <Text style={[s.stopLabel, i === eraIndex && s.stopActive]}>{e.label}</Text>
                    <Text style={s.stopSub}>{e.sub}</Text>
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
              <Text style={s.eraNote}>
                {eraLoading
                  ? era.key === 'modern'
                    ? 'Running DeepFilterNet on CPU…'
                    : `Rebuilding ${era.label} playback physics…`
                  : `${era.label} · ${era.sub}`}
              </Text>
            </View>

            <View style={s.card}>
              <View style={s.row}>
                <Pressable
                  style={s.playBtn}
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
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={s.playLabel}>
                    {status.playing ? 'Playing' : 'Paused'} — {era.label}
                  </Text>
                  <Text style={s.playTime}>
                    {fmt(status.currentTime)} / {fmt(status.duration)}
                  </Text>
                </View>
                {canShare && (
                  <Pressable style={[s.btn, s.btnGhost]} onPress={shareCurrent}>
                    <MaterialCommunityIcons name="share-variant" size={16} color="#4fd8eb" />
                    <Text style={s.btnGhostText}> Share</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={s.card}>
              {analysis ? (
                <>
                  <Text style={s.cardHead}>ANALYSIS</Text>
                  <View style={s.statRow}>
                    <Stat label="Tempo" value={`${analysis.tempo_bpm} bpm`} />
                    <Stat label="Energy" value={analysis.energy} />
                    <Stat label="Mood" value={analysis.mood} />
                  </View>
                  <View style={s.statRow}>
                    <Stat label="Brightness" value={`${analysis.brightness_hz} Hz`} />
                    <Stat label="Key (rough)" value={analysis.key_guess} />
                    <Stat label="Length" value={`${analysis.duration_s}s`} />
                  </View>
                  <Text style={s.hint}>{analysis.note}</Text>
                </>
              ) : (
                <Pressable style={[s.btn, s.btnGhost]} onPress={runAnalysis} disabled={analyzing}>
                  {analyzing ? (
                    <ActivityIndicator color="#4fd8eb" />
                  ) : (
                    <Text style={s.btnGhostText}>Analyze tempo &amp; mood (librosa)</Text>
                  )}
                </Pressable>
              )}
            </View>
          </>
        )}

        {!!error && <Text style={s.error}>⚠ {error}</Text>}

        <Text style={s.footer}>
          Past eras are physical signal modeling — no AI. The modern master is DeepFilterNet
          denoising, pretrained inference on CPU.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function fmt(sec: number | undefined) {
  const v = Math.max(0, Math.floor(sec ?? 0));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0e14' },
  scroll: { padding: 18, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: 6, textAlign: 'center', marginTop: 8 },
  titleWave: { color: '#4fd8eb' },
  titleBack: { color: '#f5b453' },
  tagline: { color: '#8b94a8', textAlign: 'center', fontSize: 11, letterSpacing: 1.5, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: '#131826', borderColor: '#262f45', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 },
  cardHead: { color: '#8b94a8', fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4fd8eb', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, gap: 6 },
  btnText: { color: '#0b0e14', fontWeight: '700' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4fd8eb' },
  btnGhostText: { color: '#4fd8eb', fontWeight: '600' },
  trackName: { color: '#4fd8eb', marginTop: 12, fontWeight: '600' },
  hint: { color: '#8b94a8', fontSize: 11, marginTop: 8 },
  stops: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stop: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  stopLabel: { color: '#8b94a8', fontSize: 12, fontWeight: '700', marginTop: 4 },
  stopActive: { color: '#4fd8eb' },
  stopSub: { color: '#5a6478', fontSize: 9 },
  eraNote: { color: '#8b94a8', textAlign: 'center', fontSize: 12, marginTop: 6 },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4fd8eb', alignItems: 'center', justifyContent: 'center' },
  playLabel: { color: '#e8ecf4', fontWeight: '600' },
  playTime: { color: '#8b94a8', fontSize: 12, marginTop: 2 },
  statRow: { flexDirection: 'row', marginBottom: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#e8ecf4', fontWeight: '700', fontSize: 15, textTransform: 'capitalize' },
  statLabel: { color: '#8b94a8', fontSize: 10, marginTop: 2 },
  error: { color: '#e77', textAlign: 'center', marginBottom: 10 },
  footer: { color: '#5a6478', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 8 },
});
