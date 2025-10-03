import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

function resetStatusBar() {
  // Proje status bar'ı: siyah zemin + light-content (Layout ile uyumlu)
  StatusBar.setBarStyle('light-content');
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor('#000000');
    StatusBar.setTranslucent(false);
  }
}

export function useInterstitial(unitId: string) {
  const adRef = useRef<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    adRef.current = InterstitialAd.createForAdRequest(unitId);

    const s1 = adRef.current.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));

    const finish = () => {
      setLoaded(false);
      resetStatusBar(); // 🔧 reklâm sonrası bar profilini sabitle
      const act = pendingRef.current;
      pendingRef.current = null;
      act?.();
      // bir sonrakini preload et
      adRef.current = InterstitialAd.createForAdRequest(unitId);
      adRef.current.load();
    };

    const s2 = adRef.current.addAdEventListener(AdEventType.ERROR, (e) => {
      console.log('[INT] error', e);
      finish();
    });
    const s3 = adRef.current.addAdEventListener(AdEventType.CLOSED, finish);

    adRef.current.load();
    return () => { s1(); s2(); s3(); };
  }, [unitId]);

  /** Sadece göster: true/false döner */
  const show = async () => {
    if (loaded && adRef.current) {
      try {
        await adRef.current.show();
        return true;
      } catch (e) {
        console.log('[INT] show err', e);
      }
    }
    return false;
  };

  /** Reklâmdan sonra çalışacak iş akışı: her zaman tetiklenir (error/closed) */
  const showThen = async (after: () => void) => {
    pendingRef.current = after;
    const ok = await show();
    if (!ok) {
      // 2.5 sn içinde yüklenmez/gösterilmezse kullanıcıyı bekletme
      setTimeout(() => {
        const act = pendingRef.current; pendingRef.current = null; act?.();
      }, 2500);
    }
  };

  return { show, showThen, loaded };
}
