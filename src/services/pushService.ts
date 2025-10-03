// src/services/pushService.ts
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { getToken as getAccessToken } from '../utils/storage';
import api from './api';

// Firebase default app her durumda önce init olsun
import '@react-native-firebase/app';
import { Buffer } from 'buffer';

const CACHE_PREFIX = 'last_push_token';
const RESUME_THROTTLE_MS = 30_000; // app active olduğunda en az 30sn arayla dene

let inFlight = false;
let lastResumeAttempt = 0;

/** messaging modülünü LAZY yükle (Firebase App hazır olduktan sonra) */
async function getMessaging() {
  const mod = await import('@react-native-firebase/messaging');
  return mod.default; // usage: messaging().getToken()
}

/** Basit JWT decode → sub (userId) almaya çalış */
function tryGetUserIdFromJwt(jwt?: string | null): string | null {
  if (!jwt) return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const json = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    const sub = json?.sub || json?.nameid || json?.uid;
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

function makeCacheKey(userId: string, platform: string) {
  return `${CACHE_PREFIX}::${userId}::${platform}`;
}

/** Internal: gerçek kayıt akışı (token parametresi verilirse onu kullanır) */
async function registerFlow(explicitToken?: string): Promise<string | null> {
  if (inFlight) return null;
  inFlight = true;
  try {
    // Bildirim izni açık mı?
    const s = await notifee.getNotificationSettings();
    const authorized =
      s.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      s.authorizationStatus === AuthorizationStatus.PROVISIONAL;
    if (!authorized) {
      return null;
    }

    // Login kontrolü
    const accessToken = await getAccessToken();
    if (!accessToken) {
      // login yokken artık cache'e yazmıyoruz (false positive engeli)
      return null;
    }

    const userId = tryGetUserIdFromJwt(accessToken);
    if (!userId) {
      // userId tespit edemezsek cache yazmayalım; yine de API deneyebiliriz
      // ama istikrar için userId yoksa da POST edelim (sunucu idempotent)
    }

    const messaging = await getMessaging();
    await messaging().registerDeviceForRemoteMessages();
    const token = explicitToken ?? (await messaging().getToken());
    if (!token) {
      return null;
    }

    // idempotency (sadece 200 sonrası yazdığımız cache’e bak)
    if (userId) {
      const cacheKey = makeCacheKey(userId, Platform.OS);
      const last = await AsyncStorage.getItem(cacheKey);
      if (last === token) {
        return token;
      }
    }

    const appVersion = DeviceInfo.getVersion();
    const deviceModel = DeviceInfo.getModel();

    // API'ye gönder (idempotent)
    await api.post('/device/register-push-token', {
      platform: Platform.OS, // "android" | "ios"
      fcmToken: token,
      appVersion,
      deviceModel,
    });

    // 👇 Sadece 200 OK sonrası cache yaz
    if (userId) {
      const cacheKey = makeCacheKey(userId, Platform.OS);
      await AsyncStorage.setItem(cacheKey, token);
    }

    return token;
  } catch (err) {
    console.warn('registerFlow hata:', err);
    return null;
  } finally {
    inFlight = false;
  }
}

export async function registerDeviceToken(): Promise<string | null> {
  return registerFlow(); // public facade
}

export function attachOnTokenRefresh(): () => void {
  let unsub: undefined | (() => void);
  (async () => {
    try {
      const messaging = await getMessaging();
      unsub = messaging().onTokenRefresh(async (newToken: string) => {
        // token yenilendi → aynı kurallarla tek sefer kayıt
        await registerFlow(newToken);
      });
    } catch (e) {
      console.warn('attachOnTokenRefresh init hata:', e);
    }
  })();
  return () => { if (unsub) unsub(); };
}

/** App foreground olduğunda çağır: throttle + tek sefer + login/izin guard */
export async function ensurePushRegistrationOnResume() {
  const now = Date.now();
  if (now - lastResumeAttempt < RESUME_THROTTLE_MS) return;
  lastResumeAttempt = now;
  await registerFlow();
}
