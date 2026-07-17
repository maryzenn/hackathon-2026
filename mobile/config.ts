import { Platform } from 'react-native';

// LAN IP of the Mac running server.py (uvicorn on 0.0.0.0:8000).
// If the demo network changes, update this: `ipconfig getifaddr en0`.
const LAN_HOST = '172.20.10.238';

export const API_BASE = Platform.select({
  web: 'http://localhost:8000',
  default: `http://${LAN_HOST}:8000`,
});
