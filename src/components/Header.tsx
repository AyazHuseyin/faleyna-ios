import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getMyBalance } from '../services/userService';
import eventBus from '../utils/eventBus';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Sol/Sağ kolon sabit genişlik (px). İkon + sayı için yeterli.
const SIDE_WIDTH = 120;

export default function Header() {
  const navigation = useNavigation<NavigationProp>();
  const [balance, setBalance] = useState<number>(0);

  const formattedBalance = useMemo(() => {
    try {
      return balance.toLocaleString('tr-TR');
    } catch {
      return String(balance);
    }
  }, [balance]);

  const fetchBalance = async () => {
    try {
      const result = await getMyBalance();
      setBalance(result);
    } catch (err) {
      console.error('Bakiye alınamadı:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
    }, [])
  );

  useEffect(() => {
    eventBus.on('balanceGuncellendi', fetchBalance);
    return () => {
      eventBus.off('balanceGuncellendi', fetchBalance);
    };
  }, []);

  return (
    <View style={styles.headerWrapper}>
      <ImageBackground
        source={require('../assets/images/header-background.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Sol: Balance (sabit kolon) */}
      <Pressable
        onPress={() => navigation.navigate('Balance')}
        style={({ pressed }) => [
          styles.leftSection,
          pressed && { opacity: 0.6 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image source={require('../assets/images/bakiye.png')} style={styles.bakiyeImage} />
        <Text
          style={styles.coinText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formattedBalance}
        </Text>
      </Pressable>

      {/* Orta: Başlık (her zaman gerçek merkezde) */}
      <View style={styles.centerSection}>
        <Text style={[styles.title, styles.brandFont]}>Faleyna</Text>
      </View>

      {/* Sağ: Profil (sabit kolon) */}
      <Pressable
        onPress={() => navigation.navigate('Profile')}
        style={({ pressed }) => [
          styles.rightSection,
          pressed && { opacity: 0.6 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image source={require('../assets/images/profile.png')} style={styles.profileImage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    flexDirection: 'row',
    height: 60,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    // ÖNEMLİ: space-between yok; üç sütun düzeni sabit.
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    position: 'relative',
    zIndex: 10,
  },

  // Sol sabit sütun
  leftSection: {
    width: SIDE_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  // Orta esnek sütun (her zaman ortada)
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sağ sabit sütun
  rightSection: {
    width: SIDE_WIDTH - 35 - 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  bakiyeImage: { width: 32, height: 32, resizeMode: 'contain' },
  profileImage: { width: 35, height: 35, resizeMode: 'contain' },

  coinText: {
    marginLeft: 8,
    maxWidth: SIDE_WIDTH - 32 - 8, // ikon + boşluk sonrası kalan alan
    fontSize: 18,
    color: '#5f3d9f',
    fontWeight: 'bold',
  },

  title: {
    fontSize: 25,
    color: '#5f3d9f',
    includeFontPadding: false,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // marka fontu
  brandFont: {
    fontFamily: 'DynaPuff-SemiBold',
    // fontWeight: undefined, // font sorun çıkarırsa aç
  },
});
