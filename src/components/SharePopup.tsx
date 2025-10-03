import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Share as RNShare,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ShareImageGenerate, { ShareImageGeneratorRef } from './ShareImageGenerator';

type SharePayload = {
  title?: string;
  text?: string;
  motto?: string;
};

interface SharePopupProps {
  visible: boolean;
  onClose: () => void;

  /** ✅ En yüksek öncelik: Doğrudan verilen başlık/metin */
  title?: string;
  text?: string;

  /** Eski kullanım için geriye dönük alanlar */
  payload?: SharePayload;
  fortune?: any;
  backgroundAsset?: any; // require(...)
}

const PURPLE = '#5f3d9f';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=REPLACE_WITH_PACKAGE';
const HASHTAG = '#faleyna';

const isNonEmpty = (v?: string | null) => typeof v === 'string' && v.trim().length > 0;
const pick = (...c: Array<string | undefined | null>) => c.find(isNonEmpty)?.trim() ?? '';

function buildTitleFromFortune(f?: any) {
  if (!f) return undefined;
  let t = '';
  if (isNonEmpty(f?.fortuneType)) t += f.fortuneType;
  if (isNonEmpty(f?.advisorName)) t += (t ? ' • ' : '') + f.advisorName;
  return t || undefined;
}

function buildShareMessage(title?: string, text?: string) {
  const head = isNonEmpty(title) ? `${title!.trim()}\n\n` : '';
  const base = (text || '').trim();
  return `${head}${base}\n\n${PLAY_STORE_URL}\n${HASHTAG}`;
}

export default function SharePopup(props: SharePopupProps) {
  const { visible, onClose, backgroundAsset } = props;

  const shareRef = useRef<ShareImageGeneratorRef>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ✅ Tek yerde çöz: Önce `props.text/title`, sonra payload/fortune
  const resolvedTitle: string = pick(
    props.title,
    props.payload?.title,
    buildTitleFromFortune(props.fortune),
    'Faleyna'
  );

  const resolvedText: string = pick(
    props.text,
    props.payload?.text,
    props.fortune?.resultText,
    props.fortune?.content,
    props.fortune?.message
  );

  const resolvedMotto: string | undefined = pick(
    props.payload?.motto,
    props.fortune?.motto
  ) || undefined;

  // Sistem paylaşımı
  const openSystemShare = useCallback(async () => {
    try {
      const message = buildShareMessage(resolvedTitle, resolvedText);
      await RNShare.share(
        {
          title: resolvedTitle,
          message,
          url: PLAY_STORE_URL,
        },
        {
          subject: resolvedTitle,
          dialogTitle: resolvedTitle,
        }
      );
    } catch {
      // iptal normal
    }
  }, [resolvedTitle, resolvedText]);

  // Açılınca bir kere sistem paylaşımını tetikle
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => openSystemShare(), 120);
      return () => clearTimeout(t);
    }
  }, [visible, openSystemShare]);

  const handleDownload = () => {
    shareRef.current?.openPreview();
  };

  const handleCopyText = async () => {
    try {
      Clipboard.setString(resolvedText);
      setAlertMessage('Metin kopyalandı.');
      setAlertVisible(true);
    } catch {
      setAlertMessage('Metin kopyalanamadı.');
      setAlertVisible(true);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.popup}>
            <Text style={styles.title}>Paylaş</Text>

            {/* Üst blok */}
            <View style={styles.upperBlock}>
              <TouchableOpacity style={styles.actionItem} onPress={handleDownload} activeOpacity={0.85}>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name="download-outline" size={20} color="#2c2c2c" />
                </View>
                <Text style={styles.actionText}>Görseli İndir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={handleCopyText} activeOpacity={0.85}>
                <View style={styles.iconWrapper}>
                  <FontAwesome name="copy" size={18} color="#2c2c2c" />
                </View>
                <Text style={styles.actionText}>Metni Kopyala</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={onClose} activeOpacity={0.85}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="close-outline" size={22} color="#2c2c2c" />
                </View>
                <Text style={styles.actionText}>İptal</Text>
              </TouchableOpacity>
            </View>

            {/* Alt blok: sistem paylaşımı tekrar aç */}
            <View style={styles.separator} />
            <Text style={styles.systemTitle}>Sistem Paylaş Seçenekleri</Text>
            <Text style={styles.systemHelp}>
              Bu modal açıkken cihazın varsayılan paylaşım menüsü otomatik açılır. Kapatırsanız
              aşağıdaki bağlantıyla tekrar açabilirsiniz.
            </Text>

            <TouchableOpacity onPress={openSystemShare} activeOpacity={0.7} style={styles.systemLinkWrap}>
              <Ionicons name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'} size={18} color={PURPLE} />
              <Text style={styles.systemLinkText}>Sistem paylaş menüsünü tekrar aç</Text>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Modal>

      {/* Alert */}
      <Modal visible={alertVisible} animationType="none" transparent>
        <View style={styles.overlayAlert}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Bilgi</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setAlertVisible(false)} activeOpacity={1}>
              <Text style={styles.alertButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Görsel üretici — resolvedText KESİN DOLU */}
      <View style={{ width: 0, height: 0, overflow: 'hidden' }}>
        <ShareImageGenerate
          ref={shareRef}
          payload={{
            // title: resolvedTitle,   // üstte görünmüyor ama metadata
            text: resolvedText,     // 🔒 görsele giden metin
            motto: resolvedMotto,
            brand: 'Faleyna',
          }}
          backgroundAsset={backgroundAsset}
          onSuccess={(msg: string) => { setAlertMessage(msg); setAlertVisible(true); }}
          onError={(msg: string) => { setAlertMessage(msg); setAlertVisible(true); }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0000004D', justifyContent: 'flex-end' },
  popup: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 24, zIndex: 100, elevation: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: PURPLE, marginBottom: 12 },
  upperBlock: { gap: 14 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  iconWrapper: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#EFE7FB', justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 15, color: '#1e1e1e' },
  separator: { height: 1, backgroundColor: '#E6DDF6', marginTop: 16, marginBottom: 10 },
  systemTitle: { fontSize: 14, color: '#6b6b6b', fontWeight: '700', marginBottom: 6 },
  systemHelp: { fontSize: 12, color: '#7c7c7c', lineHeight: 18, marginBottom: 10 },
  systemLinkWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  systemLinkText: { fontSize: 14, color: PURPLE, fontWeight: '700' },
  overlayAlert: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#fff', borderRadius: 15, padding: 25, width: '80%', alignItems: 'center' },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  alertMessage: { fontSize: 16, color: '#444', textAlign: 'center', marginBottom: 20 },
  alertButton: { backgroundColor: '#e7a96a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  alertButtonText: { color: '#fff', fontWeight: 'bold' },
});
