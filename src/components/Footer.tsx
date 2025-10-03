// src/components/Footer.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ImageBackground, Image, Text } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Servis + eventBus
import { getUnreadCount } from '../services/fortuneService';
import eventBus from '../utils/eventBus';

type RouteName = keyof RootStackParamList;

export default function Footer() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, RouteName>>();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const loadingRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const cnt = await getUnreadCount(); // backend: /fortune/unread-count
      setUnreadCount(cnt ?? 0);
    } catch {
      // sessiz geç
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // İlk render
  useEffect(() => { refreshUnread(); }, [refreshUnread]);

  // Canlı güncelleme
  useEffect(() => {
    const onFortuneRead = () => setUnreadCount((x) => Math.max(0, x - 1));
    const onFortuneNew = () => setUnreadCount((x) => x + 1);
    const onUnreadRefresh = () => refreshUnread();

    eventBus.on('fortuneRead', onFortuneRead);
    eventBus.on('fortuneNew', onFortuneNew);
    eventBus.on('unreadRefresh', onUnreadRefresh);

    return () => {
      eventBus.off('fortuneRead', onFortuneRead);
      eventBus.off('fortuneNew', onFortuneNew);
      eventBus.off('unreadRefresh', onUnreadRefresh);
    };
  }, [refreshUnread]);

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);
  const showBadge = unreadCount > 0;

  return (
    <View style={styles.footerWrapper}>
      <ImageBackground
        source={require('../assets/images/footer-bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('Home')}>
        <View style={styles.iconCenter}>
          <Image source={require('../assets/images/home.png')} style={styles.home} />
          {route.name === 'Home' && <View style={styles.underline} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('ChooseFortuneType')}>
        <View style={styles.iconCenter}>
          <Image source={require('../assets/images/fal.png')} style={styles.fal} />
          {route.name === 'ChooseFortuneType' && <View style={styles.underline} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('Advisors')}>
        <View style={styles.iconCenter}>
          <Image source={require('../assets/images/yorumcular.png')} style={styles.yorumcular} />
          {route.name === 'Advisors' && <View style={styles.underline} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('FortuneHistory')}>
        <View style={styles.iconCenter}>
          <Image source={require('../assets/images/gecmis.png')} style={styles.gecmis} />
          {showBadge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
          {route.name === 'FortuneHistory' && <View style={styles.underline} />}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const BADGE_SIZE = 18;

const styles = StyleSheet.create({
  footerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 12,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  iconCenter: { alignItems: 'center', justifyContent: 'center' },
  underline: { marginTop: 4, width: 30, height: 3, backgroundColor: '#e7a96a', borderRadius: 2 },
  home: { width: 30, height: 30, resizeMode: 'contain' },
  yorumcular: { width: 35, height: 35, resizeMode: 'contain' },
  fal: { width: 37, height: 37, resizeMode: 'contain' },
  gecmis: { width: 37, height: 37, resizeMode: 'contain' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -12,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    paddingHorizontal: 4,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
