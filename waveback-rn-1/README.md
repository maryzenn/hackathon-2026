# Waveback — React Native + TypeScript + Tailwind (NativeWind)

Port of the Waveback "Groove Decades" player screen (390×844, iOS-safe).

## Files
- `WavebackScreen.tsx` — screen composition: layout, playback/era state, transport, timeline.
- `components/Disc.tsx` — spinning groove disc (ripple, processing pulse, cover label).
- `components/EraChip.tsx` — era chip with ring stack + BPM glyph animation.
- `components/Glyph.tsx` — all era icons.
- `components/SongSheet.tsx` — song picker sheet (search, add button, scroll list).
- `theme.ts` (palette + theme tokens) · `eras.ts` (era defs) · `songs.ts` (library + `fmt`).
- `App.tsx` — example entry (font loading + props).
- `tailwind.config.js` / `global.css` — NativeWind v4 setup with the brand palette.

## Setup (Expo)
```bash
npx create-expo-app waveback -t expo-template-blank-typescript
cd waveback
npx expo install nativewind tailwindcss react-native-svg react-native-safe-area-context \
  @expo-google-fonts/young-serif @expo-google-fonts/nunito-sans expo-font
```
Then follow the NativeWind v4 install docs (babel preset + metro `withNativeWind`), copy these files in, and `npx expo start`.

## Props (`WavebackScreenProps`)
- `theme`: `'espresso' | 'cream'` (default espresso)
- `spinSeconds`: disc rotation period (default 10)
- `title`, `artist` come from `songs: Song[]` (the header note button opens a bottom-sheet song picker; picking resets the clock)
- Each `Song` has a `cover` (see `assets/label-*.png` — generated record-label art); it shows on the disc and in the picker rows. Pass your own artwork per song, or `cover` on the screen to override all.
- The picker sheet has a search field (local filter) and a `+` button — pass `onAddSong` and wire it to `expo-document-picker` (`type: 'audio/*'`) to append to your songs state; the HTML design does this with a native file input + real `Audio` playback.
- `grainTexture`: optional tiling noise PNG for the paper-grain overlay (RN has no CSS turbulence filter — export a ~140px noise tile at low contrast; it renders at 5–8.5% opacity per theme)

## Behavior parity with the HTML design
- One era active at a time; tap active chip → back to "ORIGINAL · TODAY".
- Selecting ripples rings **outward** going down in time, **inward** going up; outermost ring pulses amber for 1.7s ("RESTORING… / REWINDING… / RETURNING…").
- Playback clock is simulated (0:00–3:42); tap the groove to seek. Wire `togglePlay`/`t` to a real player (e.g. `expo-av`) where marked.
- Rotation pauses/resumes from the current angle (Animated, native driver).

## Known deltas
- Amber glow uses `shadow*`/`elevation` instead of CSS `drop-shadow` (subtler on Android).
- Grain requires the optional texture asset (see above).
- Selected past-era glyphs animate: DC spins the cassette reels individually; RN rocks the cassette body instead (native-driver loop, no per-reel SVG animation).
- Haptics suggestion: `Haptics.selectionAsync()` on era pick feels great — not included to keep deps minimal.
