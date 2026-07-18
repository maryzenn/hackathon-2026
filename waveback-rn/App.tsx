import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import {
  NunitoSans_400Regular, NunitoSans_600SemiBold,
  NunitoSans_700Bold, NunitoSans_800ExtraBold,
} from '@expo-google-fonts/nunito-sans';
import WavebackScreen from './WavebackScreen';
import './global.css';

export default function App() {
  const [loaded] = useFonts({
    YoungSerif_400Regular,
    NunitoSans_400Regular, NunitoSans_600SemiBold,
    NunitoSans_700Bold, NunitoSans_800ExtraBold,
  });
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <WavebackScreen
        theme="espresso"          // or "cream"
        spinSeconds={10}
        // songs={[{ title: 'My Song', artist: 'Me', dur: 215 }]}
        // cover={require('./assets/cover.jpg')}
        // grainTexture={require('./assets/grain.png')}
      />
    </SafeAreaProvider>
  );
}
