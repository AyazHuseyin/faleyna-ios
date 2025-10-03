// src/realTime/startSignalR.ts
import * as signalR from '@microsoft/signalr';
import eventBus from '../utils/eventBus';
import { getToken } from '../utils/storage';

const HUB_BASE = 'https://api.faleyna.online';

let connection: signalR.HubConnection | null = null;
let starting = false;

async function resolveJwt(): Promise<string | null> {
  try {
    const t = await getToken();
    if (t && t.length > 10) return t.replace(/^Bearer\s+/i, '').trim();
  } catch {}
  return null;
}

export async function startSignalR(): Promise<void> {
  if (connection || starting) return;
  starting = true;

  const jwt = await resolveJwt();
  if (!jwt) {
    // Token yoksa bir süre sonra tekrar dene (sessiz)
    setTimeout(() => {
      starting = false;
      startSignalR().catch(() => {});
    }, 5000);
    return;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/notify`, {
      accessTokenFactory: async () => (await resolveJwt()) ?? '',
      withCredentials: false, // CORS cookie yok
      // transport belirtmiyoruz -> WS, SSE/LP fallback otomatik
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(__DEV__ ? signalR.LogLevel.Warning : signalR.LogLevel.None)
    .build();

  // lifecycle loglarını sessiz tutuyoruz; sadece dev modda uyarı
  connection.onreconnecting(() => { /* no-op */ });
  connection.onreconnected(() => { /* no-op */ });
  connection.onclose(() => { /* no-op */ });

  // Backend -> UI event
  connection.on('fortuneReady', (_payload: any) => {
    // Badge'i ve listeyi güncelle
    eventBus.emit('fortuneNew', undefined);
    eventBus.emit('unreadRefresh', undefined);
  });

  try {
    await connection.start();
    // İstersen başka yerlerde dinlemek için haber veriyoruz (alert yok)
    eventBus.emit('signalRConnected', undefined as any);
  } catch {
    // Bağlantı hatasında 10 sn sonra tekrar dene (sessiz)
    setTimeout(() => {
      starting = false;
      startSignalR().catch(() => {});
    }, 10000);
    return;
  } finally {
    starting = false;
  }
}

export async function stopSignalR(): Promise<void> {
  if (!connection) return;
  try { await connection.stop(); } catch {}
  connection = null;
}
