// src/screens/TransitScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal as RNModal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
  Modal,        // 👈 DatePicker için kendi modalımız
  Pressable,    // 👈 özelleştirilmiş butonlar
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import SweetAlert from '../components/SweetAlert';
import DatePicker from 'react-native-date-picker';

import SelectPicker from '../components/SelectPicker';
import cityData from '../utils/cityData.json';
import fortuneService from '../services/fortuneService';
import { RootStackParamList } from '../types/navigation';

// Route type for this screen
type TransitScreenRouteProp = RouteProp<RootStackParamList, 'Transit'>;

export default function TransitScreen(): React.JSX.Element {
  const route = useRoute<TransitScreenRouteProp>();
  const { advisorId, advisorPrice } = route.params;

  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // ---- Form state
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthTime, setBirthTime] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [intention, setIntention] = useState('');

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // ---- DatePicker modal açık/kapalı durumları (KENDİ modalımız için)
  const [openBirthDate, setOpenBirthDate] = useState(false);
  const [openBirthTime, setOpenBirthTime] = useState(false);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);

  // Geçici değerler (İptal edince kalıcı state bozulmasın)
  const [tmpBirthDate, setTmpBirthDate] = useState<Date>(birthDate);
  const [tmpBirthTime, setTmpBirthTime] = useState<Date>(birthTime);
  const [tmpStartDate, setTmpStartDate] = useState<Date>(startDate);
  const [tmpEndDate, setTmpEndDate] = useState<Date>(endDate);

  const cityList = cityData.map(c => ({ label: c.il, value: c.il }));
  const districtList =
    cityData.find(c => c.il === selectedCity)?.ilceler.map(d => ({ label: d, value: d })) || [];

  const handleSubmit = async (): Promise<void> => {
    if (!selectedCity || !selectedDistrict || !selectedGender) {
      setAlertMessage('Lütfen tüm alanları doldurunuz.');
      setAlertVisible(true);
      return;
    }
    if (endDate < startDate) {
      setAlertMessage('Bitiş tarihi, başlangıç tarihinden önce olamaz.');
      setAlertVisible(true);
      return;
    }

    try {
      setModalVisible(false);
      setLoading(true);

      await fortuneService.sendTransitFortune({
        advisorId: advisorId.toString(),
        advisorPrice: advisorPrice.toString(),
        birthDate: birthDate.toISOString(),
        birthTime: birthTime.toTimeString().slice(0, 5),
        city: selectedCity,
        district: selectedDistrict,
        gender: selectedGender,
        intention,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      setAlertMessage('İsteğiniz alındı. Yorumunuz kısa sürde hazır olacak.');
    } catch (err: any) {
      console.error('Hata:', err);
      setAlertMessage(err.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
      setAlertVisible(true);
    }
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <Layout showHeader showFooter>
        <View style={styles.container}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Transit Yorumu</Text>
            <View style={styles.titleLine} />
            <View style={styles.descriptionBox}>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>🛰️</Text>
                <Text style={styles.text}>
                  Gezegenlerin şu anki (ve seçtiğin aralıktaki) hareketlerinin doğum haritandaki
                  noktalarla yaptığı açılar analiz edilir.
                </Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>⏱️</Text>
                <Text style={styles.text}>
                  Başlangıç ve bitiş tarihleri, etkilerin yoğunlaştığı dönemleri netleştirir.
                </Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>🎯</Text>
                <Text style={styles.text}>
                  Önümüzdeki dönem için fırsat alanları ve dikkat edilmesi gereken temaları vurgular.
                </Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>📩</Text>
                <Text style={styles.text}>Sonuç 5 dakika içinde fal geçmişinize düşer.</Text>
              </View>
            </View>
            <Image
              source={require('../assets/images/transit.webp')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>Yorumla</Text>
          </TouchableOpacity>
        </View>
      </Layout>

      {/* ---- Form Modal */}
      <RNModal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrapper}
          >
            <View style={styles.modalContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Doğum Bilgilerin</Text>

                {/* Doğum tarihi */}
                <Text style={styles.label}>Doğum Tarihi</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => { setTmpBirthDate(birthDate); setOpenBirthDate(true); }}
                >
                  <Text>📅 {birthDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>

                {/* Doğum saati */}
                <Text style={styles.label}>Doğum Saati</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => { setTmpBirthTime(birthTime); setOpenBirthTime(true); }}
                >
                  <Text>
                    ⏰{' '}
                    {birthTime.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>

                <SelectPicker
                  label="İl Seçiniz"
                  selectedValue={selectedCity}
                  onValueChange={(value) => {
                    setSelectedCity(value.toString());
                    setSelectedDistrict('');
                  }}
                  items={cityList}
                />

                <SelectPicker
                  label="İlçe Seçiniz"
                  selectedValue={selectedDistrict}
                  onValueChange={(value) => setSelectedDistrict(value.toString())}
                  items={districtList}
                />

                <SelectPicker
                  label="Cinsiyet"
                  selectedValue={selectedGender}
                  onValueChange={(value) => setSelectedGender(value.toString())}
                  items={[
                    { label: 'Kadın', value: 'Kadın' },
                    { label: 'Erkek', value: 'Erkek' },
                    { label: 'Diğer', value: 'Diğer' },
                  ]}
                />

                <TextInput
                  placeholder="Niyet (isteğe bağlı)"
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={intention}
                  onChangeText={setIntention}
                  multiline
                />

                {/* Transit aralığı */}
                <Text style={styles.label}>Başlangıç Tarihi</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => { setTmpStartDate(startDate); setOpenStartDate(true); }}
                >
                  <Text>📅 {startDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Bitiş Tarihi</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => { setTmpEndDate(endDate); setOpenEndDate(true); }}
                >
                  <Text>📅 {endDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalButton} onPress={handleSubmit}>
                  <Text style={styles.modalButtonText}>Gönder</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 12 }}>
                  <Text style={{ textAlign: 'center', color: '#999' }}>Vazgeç</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </RNModal>

      {/* ---- DatePicker Modalları */}
      {/* Doğum Tarihi */}
      <Modal visible={openBirthDate} transparent animationType="fade" onRequestClose={() => setOpenBirthDate(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalCard}>
            <Text style={styles.dpTitle}>Tarih Seçiniz</Text>
            <DatePicker
              date={tmpBirthDate}
              mode="date"
              locale="tr"
              maximumDate={new Date()}
              onDateChange={(d) => setTmpBirthDate(d)}
              theme="light"
            />
            <View style={styles.dpButtonsRow}>
              <Pressable style={[styles.dpBtn, styles.dpBtnCancel]} onPress={() => setOpenBirthDate(false)}>
                <Text style={styles.dpBtnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.dpBtn, styles.dpBtnConfirm]}
                onPress={() => { setBirthDate(tmpBirthDate); setOpenBirthDate(false); }}
              >
                <Text style={styles.dpBtnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Doğum Saati */}
      <Modal visible={openBirthTime} transparent animationType="fade" onRequestClose={() => setOpenBirthTime(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalCard}>
            <Text style={styles.dpTitle}>Saat Seçiniz</Text>
            <DatePicker
              date={tmpBirthTime}
              mode="time"
              locale="tr"
              onDateChange={(t) => setTmpBirthTime(t)}
              theme="light"
            />
            <View style={styles.dpButtonsRow}>
              <Pressable style={[styles.dpBtn, styles.dpBtnCancel]} onPress={() => setOpenBirthTime(false)}>
                <Text style={styles.dpBtnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.dpBtn, styles.dpBtnConfirm]}
                onPress={() => { setBirthTime(tmpBirthTime); setOpenBirthTime(false); }}
              >
                <Text style={styles.dpBtnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Başlangıç Tarihi */}
      <Modal visible={openStartDate} transparent animationType="fade" onRequestClose={() => setOpenStartDate(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalCard}>
            <Text style={styles.dpTitle}>Başlangıç Tarihi</Text>
            <DatePicker
              date={tmpStartDate}
              mode="date"
              locale="tr"
              onDateChange={(d) => setTmpStartDate(d)}
              theme="light"
            />
            <View style={styles.dpButtonsRow}>
              <Pressable style={[styles.dpBtn, styles.dpBtnCancel]} onPress={() => setOpenStartDate(false)}>
                <Text style={styles.dpBtnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.dpBtn, styles.dpBtnConfirm]}
                onPress={() => {
                  setStartDate(tmpStartDate);
                  if (endDate < tmpStartDate) setEndDate(tmpStartDate);
                  setOpenStartDate(false);
                }}
              >
                <Text style={styles.dpBtnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bitiş Tarihi */}
      <Modal visible={openEndDate} transparent animationType="fade" onRequestClose={() => setOpenEndDate(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalCard}>
            <Text style={styles.dpTitle}>Bitiş Tarihi</Text>
            <DatePicker
              date={tmpEndDate}
              mode="date"
              locale="tr"
              minimumDate={startDate}
              onDateChange={(d) => setTmpEndDate(d)}
              theme="light"
            />
            <View style={styles.dpButtonsRow}>
              <Pressable style={[styles.dpBtn, styles.dpBtnCancel]} onPress={() => setOpenEndDate(false)}>
                <Text style={styles.dpBtnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.dpBtn, styles.dpBtnConfirm]}
                onPress={() => { setEndDate(tmpEndDate); setOpenEndDate(false); }}
              >
                <Text style={styles.dpBtnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SweetAlert visible={alertVisible} message={alertMessage} onClose={() => setAlertVisible(false)} />
      {loading && <Loader visible={true} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: 'relative' },
  container: {
    flex: 1,
    backgroundColor: '#FAEFE6',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginHorizontal: 20,
    paddingTop: 10,
    marginTop: 10,
    paddingBottom: 16,
    borderRadius: 6,
  },
  titleBox: { marginBottom: 16, textAlign: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5f3d9f',
    textAlign: 'center',
    paddingVertical: 10,
  },
  titleLine: {
    height: 3,
    backgroundColor: '#e7a96a',
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 10,
  },
  descriptionBox: { marginBottom: 16, paddingHorizontal: 10 },
  descriptionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  icon: { width: 24, fontSize: 18, marginRight: 8, lineHeight: 20 },
  text: { flex: 1, fontSize: 14, color: '#5f3d9f', lineHeight: 20 },

  keyboardWrapper: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxHeight: '90%' },
  bannerImage: { width: '100%', height: 160, borderRadius: 10, marginTop: 10, marginBottom: 20 },
  button: { backgroundColor: '#e7a96a', paddingVertical: 12, borderRadius: 10, marginBottom: 20, width: '100%' },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },

  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#5f3d9f', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, marginBottom: 4, color: '#333', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 12 },
  modalButton: { backgroundColor: '#5f3d9f', paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  modalButtonText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },

  dpModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000055',
  },
  dpModalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  dpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'left',
  },
  dpButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  dpBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dpBtnCancel: {
    backgroundColor: '#5f3d9f',
    marginRight: 6,
  },
  dpBtnCancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  dpBtnConfirm: {
    backgroundColor: '#e7a96a',
    marginLeft: 6,
  },
  dpBtnConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
