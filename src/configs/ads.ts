// src/config/ads.ts
import mobileAds, {
  MaxAdContentRating,
  AppOpenAd,
  AdEventType,
  RequestOptions,
} from 'react-native-google-mobile-ads';

export const AdUnitIds = {
  rewarded:     'ca-app-pub-9439925710580612/4787122277',
  interstitial: 'ca-app-pub-9439925710580612/4100726566',
  banner:       'ca-app-pub-9439925710580612/2194965569',
  appOpen:      'ca-app-pub-9439925710580612/3114947957',
};

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
