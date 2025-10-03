import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import SharePopup from '../components/SharePopup';
import { getFortuneDetail, submitFortuneFeedback, markFortuneRead } from '../services/fortuneService';
import { resolveAvatar } from '../utils/avatarResolver';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import eventBus from '../utils/eventBus';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryDetail'>;

export default function HistoryDetailScreen({ route, navigation }: Props) {
  const { fortuneId } = route.params;
  const [fortune, setFortune] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [showShare, setShowShare] = useState(false);

  // aynı ekranda tekrar render olursa birden çok markRead çağrısını engellemek için
  const markOnceRef = useRef(false);

  const fetchDetail = async () => {
    const startTime = Date.now();
    try {
      const data = await getFortuneDetail(String(fortuneId));
      setFortune(data);
      setIsLiked(data.isLiked);
    } catch (err) {
      console.error('Detay getirilemedi:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      const wait = Math.max(300 - elapsed, 0);
      setTimeout(() => setLoading(false), wait);
    }
  };

  useEffect(() => { 
    markOnceRef.current = false; // yeni id geldiğinde sıfırla
    fetchDetail(); 
  }, [fortuneId]);

  // Detaydan çıkarken listeyi tazelemek için (senin mevcut mantığın)
  useFocusEffect(
    useCallback(() => {
      return () => { navigation.setParams({ refreshFromDetail: true } as any); };
    }, [navigation])
  );

  // Ekran açıldığında (detay geldikten sonra) okundu işaretle
  useEffect(() => {
    const markIfNeeded = async () => {
      if (loading) return;
      if (!fortune) return;
      if (markOnceRef.current) return;

      // Backend'in döndüğü yapıda "isUnread" alanın varsa onu kullan.
      // Yoksa IsRead/ReadyAt üzerinde de kontrol yapabilirsin.
      if (fortune.isUnread === true || fortune.isRead === false) {
        try {
          const ok = await markFortuneRead(String(fortuneId));
          if (ok) {
            markOnceRef.current = true;
            // Local state'te de anında yansıt
            setFortune((prev: any) => prev ? { ...prev, isUnread: false, isRead: true, readAt: new Date().toISOString() } : prev);
            // Footer rozetini azalt + History listesi refresh tetiklemesi
            eventBus.emit('fortuneRead', undefined);
          }
        } catch (err) {
          // Sessiz geç (okundu işaretleme başarısızsa UI'yı bozmayalım)
          console.warn('Okundu işaretlenemedi:', err);
        }
      }
    };

    markIfNeeded();
  }, [loading, fortune, fortuneId]);

  const submitFeedback = async (likeValue: boolean) => {
    try {
      await submitFortuneFeedback(String(fortuneId), likeValue);
      setIsLiked(likeValue);
    } catch (err) {
      console.error('Geri bildirim gönderilemedi:', err);
    }
  };

  if (loading) return <Loader visible={true} />;

  // ✅ Başlık/metin burada kesin oluşturuluyor
  const shareTitle =
    (fortune?.fortuneType ? `${fortune.fortuneType}` : 'Faleyna') +
    (fortune?.advisorName ? ` • ${fortune.advisorName}` : '');

  const shareText =
    (fortune?.resultText ?? '').trim() ||
    (fortune?.content ?? '').trim() ||
    (fortune?.message ?? '').trim() ||
    '';

  return (
    <View style={styles.wrapper}>
      <Layout showHeader showFooter>
        <View style={styles.container}>
          {fortune && (
            <View style={styles.commentBox}>
              <View style={styles.topSection}>
                <Image source={resolveAvatar(String(fortune.advisorAvatarUrl))} style={styles.avatar} />
                <View style={styles.infoSection}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Fal Tipi:</Text>
                    <Text style={styles.value}>{fortune.fortuneType}</Text>
                  </View>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Yorumcu:</Text>
                    <Text style={styles.value}>{fortune.advisorName}</Text>
                  </View>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Tarih:</Text>
                    <Text style={styles.value}>
                      {new Date(fortune.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.iconRow}>
                    <TouchableOpacity onPress={() => submitFeedback(true)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="thumb-up-outline" size={28} color={isLiked === true ? '#e7a96a' : '#351a75'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => submitFeedback(false)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="thumb-down-outline" size={28} color={isLiked === false ? '#e7a96a' : '#351a75'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowShare(true)} activeOpacity={0.7}>
                      <Ionicons name="share-social-outline" size={28} color="#351a75" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                <Text style={styles.resultText}>{shareText}</Text>
              </ScrollView>
            </View>
          )}
        </View>
      </Layout>

      {/* ✅ SharePopup'a doğrudan title/text veriyoruz */}
      <SharePopup
        visible={showShare}
        onClose={() => setShowShare(false)}
        title={shareTitle}
        text={shareText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  commentBox: { flex: 1, backgroundColor: '#FAEFE6', padding: 20, borderRadius: 4 },
  topSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 30 },
  avatar: { width: 110, height: 110, borderRadius: 5, resizeMode: 'contain', backgroundColor: '#ccc' },
  infoSection: { flex: 1, justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  label: { fontWeight: 'bold', color: '#351a75', minWidth: 80 },
  value: { color: '#333', fontSize: 14 },
  iconRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  separator: { height: 1, backgroundColor: '#351a75', opacity: 0.6, marginVertical: 16 },
  scrollArea: { flex: 1 },
  resultText: { fontSize: 15, color: '#351a75', lineHeight: 22 },
});
