// src/screens/FortuneHistoryScreen.tsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import fortuneService from '../services/fortuneService';
import TabCard from '../components/TabCard';
import { resolveAvatar } from '../utils/avatarResolver';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Ads
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AdUnitIds } from '../configs/ads';

// EventBus
import eventBus from '../utils/eventBus';

// 🔔 Notifications
import notifee, { AuthorizationStatus, AndroidImportance } from '@notifee/react-native';
import { registerDeviceToken } from '../services/pushService';

type FortuneHistoryItem = {
  id: number;
  advisorName: string;
  advisorAvatarUrl: string;
  fortuneType: string;
  createdAt: string;
  summary: string;
  isUnread: boolean;
};

export default function FortuneHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [history, setHistory] = useState<FortuneHistoryItem[]>([]);
  const [fortuneTypes, setFortuneTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 🔔 izin / token durumu (compact bar)
  const [notifChecking, setNotifChecking] = useState<boolean>(true);
  const [notifAuthorized, setNotifAuthorized] = useState<boolean>(false);
  const [notifBusy, setNotifBusy] = useState<boolean>(false);
  const [notifDismissed, setNotifDismissed] = useState<boolean>(false);
  const [needsSettings, setNeedsSettings] = useState<boolean>(false);

  // Ads
  const [adLoaded, setAdLoaded] = useState(false);
  const pendingActionRef = useRef<null | (() => void)>(null);
  const lastShownAtRef = useRef<number>(0);
  const MIN_INTERVAL_MS = 60 * 1000;

  const interstitial = useMemo(
    () => InterstitialAd.createForAdRequest(AdUnitIds.interstitial),
    []
  );

  useEffect(() => {
    const onLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => setAdLoaded(true));
    const onClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      lastShownAtRef.current = Date.now();
      interstitial.load();
      pendingActionRef.current?.();
      pendingActionRef.current = null;
    });
    const onError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      setAdLoaded(false);
      pendingActionRef.current?.();
      pendingActionRef.current = null;
    });
    interstitial.load();
    return () => { onLoaded(); onClosed(); onError(); };
  }, [interstitial]);

  const refreshFortuneTypes = useCallback(async () => {
    try {
      const data = await fortuneService.getFortuneTypes();
      setFortuneTypes(['Tümü', ...data.map((t: any) => t.name)]);
    } catch (error) {
      console.error('Fal tipleri alınamadı:', error);
    }
  }, []);

  const reloadList = useCallback(
    async (typeParam?: string) => {
      const type = typeParam ?? selectedType;
      setLoading(true);
      setHistory([]);
      setPage(1);
      setHasMore(true);
      try {
        const data = await fortuneService.getFortuneHistory(1, type === 'Tümü' ? [] : [type]);
        setHistory(data);
        setPage(2);
        setHasMore(data.length === 10);
      } catch (error) {
        console.error('Fal geçmişi alınamadı:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [selectedType]
  );

  const checkNotificationPermission = useCallback(async () => {
    try {
      const settings = await notifee.getNotificationSettings();
      const st = settings.authorizationStatus;
      const authorized = st === AuthorizationStatus.AUTHORIZED || st === AuthorizationStatus.PROVISIONAL;
      setNotifAuthorized(authorized);
      setNeedsSettings(!authorized);
    } catch (e) {
      console.warn('Bildirim ayarları okunamadı:', e);
      setNotifAuthorized(false);
      setNeedsSettings(true);
    } finally {
      setNotifChecking(false);
    }
  }, []);

  // Ekran odaklandığında: liste + izin kontrolü + bar reset
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!active) return;
        await refreshFortuneTypes();
        await reloadList();
        await checkNotificationPermission();
        setNotifDismissed(false);
      })();
      return () => { active = false; };
    }, [refreshFortuneTypes, reloadList, checkNotificationPermission])
  );

  // SignalR olayları: SADECE bu ekrandayken listeyi yenile (loader bu ekranda görünür)
  useEffect(() => {
    const onReadyOrRefresh = () => {
      if (isFocused) reloadList(selectedType);
      // odaklı değilsek yapma; badge zaten Footer'da güncelleniyor
    };
    eventBus.on('fortuneNew', onReadyOrRefresh);
    eventBus.on('unreadRefresh', onReadyOrRefresh);
    return () => {
      eventBus.off('fortuneNew', onReadyOrRefresh);
      eventBus.off('unreadRefresh', onReadyOrRefresh);
    };
  }, [isFocused, reloadList, selectedType]);

  const fetchMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fortuneService.getFortuneHistory(
        page,
        selectedType === 'Tümü' ? [] : [selectedType]
      );
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setHistory(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        if (data.length < 10) setHasMore(false);
      }
    } catch (error) {
      console.error('Yeni veri alınamadı:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const openDetailWithInterstitial = (fortuneId: number) => {
    const go = () =>
      navigation.navigate('HistoryDetail', {
        fortuneId,
        onGoBack: () => reloadList(),
      } as any);

    const now = Date.now();
    const intervalOk = now - lastShownAtRef.current >= MIN_INTERVAL_MS;
    if (adLoaded && intervalOk) {
      pendingActionRef.current = go;
      interstitial.show().catch(() => {
        pendingActionRef.current = null;
        go();
      });
    } else {
      go();
    }
  };

  const renderHistoryCard = ({ item }: { item: FortuneHistoryItem }) => (
    <TabCard
      name={item.advisorName}
      motto={`${item.fortuneType} - ${new Date(item.createdAt).toLocaleDateString()}`}
      description={item.summary}
      image={resolveAvatar(item.advisorAvatarUrl)}
      showBadge={item.isUnread}
      pressable
      onPress={() => openDetailWithInterstitial(item.id)}
    />
  );

  // 🔔 Compact notice bar (bildirim açtırma)
  const onEnableNotifications = async () => {
    try {
      setNotifBusy(true);
      if (needsSettings) {
        try { await notifee.openNotificationSettings(); } catch {}
        await checkNotificationPermission();
        const s = await notifee.getNotificationSettings();
        const authorized = s.authorizationStatus === AuthorizationStatus.AUTHORIZED || s.authorizationStatus === AuthorizationStatus.PROVISIONAL;
        if (authorized) setNotifDismissed(true);
        return;
      }
      await notifee.createChannel({ id: 'default', name: 'Genel Bildirimler', importance: AndroidImportance.DEFAULT });
      const perm = await notifee.requestPermission();
      const ok = perm.authorizationStatus === AuthorizationStatus.AUTHORIZED || perm.authorizationStatus === AuthorizationStatus.PROVISIONAL;
      if (!ok) { setNotifAuthorized(false); setNeedsSettings(true); return; }
      const saved = await registerDeviceToken();
      if (saved) { setNotifAuthorized(true); setNeedsSettings(false); setNotifDismissed(true); }
    } catch (e) {
      console.warn('Bildirim izni/token alınamadı:', e);
      setNotifAuthorized(false);
      setNeedsSettings(true);
    } finally {
      setNotifBusy(false);
    }
  };

  const CompactNoticeBar = () => {
    if (notifChecking || notifAuthorized || notifDismissed) return null;
    return (
      <View style={styles.noticeBar}>
        <Text style={styles.noticeBarText} numberOfLines={1}>🔔 Falın hazır olduğunda haber verelim mi?</Text>
        <View style={styles.noticeBarActions}>
          <TouchableOpacity onPress={onEnableNotifications} style={[styles.noticeBarBtn, notifBusy && { opacity: 0.7 }]} disabled={notifBusy}>
            <Text style={styles.noticeBarBtnText}>{notifBusy ? 'Açılıyor…' : needsSettings ? 'Ayarları Aç' : 'Aç'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setNotifDismissed(true)} style={styles.noticeBarClose}>
            <Text style={styles.noticeBarCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
      {loadingMore && <ActivityIndicator size="small" color="#5f3d9f" />}
      {!hasMore && !loadingMore && <Text style={styles.endText}>Tüm fal geçmişin yüklendi.</Text>}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Layout showHeader showFooter>
        <View style={styles.container}>
          <Text style={styles.title}>Geçmiş Fallarım</Text>
          <CompactNoticeBar />
          {renderFilterButtons()}
          {!loading && (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHistoryCard}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              onEndReached={fetchMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderFooter}
            />
          )}
        </View>
      </Layout>
      <Loader visible={loading} />
    </View>
  );

  function renderFilterButtons() {
    return (
      <View style={styles.filterWrapper}>
        {fortuneTypes.map(type => (
          <TouchableOpacity
            key={type}
            activeOpacity={0.7}
            style={[styles.filterButton, selectedType === type && styles.filterButtonActive]}
            onPress={() => {
              if (type !== selectedType) {
                setSelectedType(type);
                reloadList(type);
              }
            }}
          >
            <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  title: {
    fontSize: 18, fontWeight: 'bold', color: '#e7a96a', marginBottom: 8,
    backgroundColor: '#FAEFE6', padding: 10, textAlign: 'center', borderRadius: 8, elevation: 1,
  },

  // 🔔 compact notice bar
  noticeBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0',
    borderWidth: 1, borderColor: '#F3E0CC', borderRadius: 8, paddingVertical: 6,
    paddingHorizontal: 10, marginBottom: 8,
  },
  noticeBarText: { flex: 1, fontSize: 12, color: '#5f3d9f' },
  noticeBarActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  noticeBarBtn: { backgroundColor: '#e7a96a', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  noticeBarBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  noticeBarClose: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2 },
  noticeBarCloseText: { fontSize: 16, color: '#a77b52', lineHeight: 16, fontWeight: 'bold' },

  filterWrapper: {
    backgroundColor: '#FAEFE6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start',
    marginBottom: 10, elevation: 1,
  },
  filterButton: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff',
    marginRight: 3, marginBottom: 6,
  },
  filterButtonActive: { backgroundColor: '#e7a96a' },
  filterText: { fontSize: 14, color: '#5f3d9f' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },

  endText: { marginTop: 10, color: '#5f3d9f', fontSize: 13, fontWeight: 'bold' },
});
