// src/configs/ads.ts
import {Platform} from 'react-native';
import mobileAds, {
  MaxAdContentRating,
  AppOpenAd,
  AdEventType,
  RequestOptions,
} from 'react-native-google-mobile-ads';

// Android ve iOS için ayrı reklam birimleri.
// Android değerleri mevcut; iOS değerlerini sağladıktan sonra aşağıya yerleştireceğiz.
const ANDROID_UNITS = {
  rewarded: 'ca-app-pub-9439925710580612/4787122277',
  interstitial: 'ca-app-pub-9439925710580612/4100726566',
  banner: 'ca-app-pub-9439925710580612/2194965569',
  appOpen: 'ca-app-pub-9439925710580612/3114947957',
};

const IOS_UNITS = {
  // Aşağıdaki placeholder'ları iOS reklam birimi ID'leri ile değiştireceğiz
  rewarded: 'ca-app-pub-3940256099942544/1712485313', // TEST Rewarded
  interstitial: 'ca-app-pub-3940256099942544/1033173712', // TEST Interstitial
  banner: 'ca-app-pub-3940256099942544/2934735716', // TEST Banner
  appOpen: 'ca-app-pub-3940256099942544/5662855259', // TEST App Open
};

export const AdUnitIds = Platform.select({
  ios: IOS_UNITS,
  android: ANDROID_UNITS,
  default: ANDROID_UNITS,
});

export async function initAds(cfg?: Partial<RequestOptions>) {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.T,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
    ...(cfg ?? {}),
  });
  await mobileAds().initialize();
}

let appOpenAd: AppOpenAd | null = null;
let appOpenLoaded = false;
let appOpenLoading = false;

export function prepareAppOpen() {
  if (appOpenLoaded || appOpenLoading) return;

  if (!appOpenAd) {
    appOpenAd = AppOpenAd.createForAdRequest(AdUnitIds.appOpen);

    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      appOpenLoaded = true;
      appOpenLoading = false;
    });

    appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
      appOpenLoaded = false;
      appOpenLoading = false;
      appOpenAd = null;
    });

    appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenLoaded = false;
      appOpenLoading = false;
      appOpenAd = null;
    });
  }

  appOpenLoading = true;
  appOpenAd.load();
}

export async function showAppOpenIfReady(): Promise<boolean> {
  if (appOpenAd && appOpenLoaded) {
    try {
      await appOpenAd.show();
      return true;
    } finally {
      appOpenLoaded = false;
      appOpenLoading = false;
    }
  }
  return false;
}

export function resetAppOpen() {
  appOpenAd = null;
  appOpenLoaded = false;
  appOpenLoading = false;
}
