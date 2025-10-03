// src/screens/StarMapScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
  Pressable, // 👈 eklendi
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import SweetAlert from '../components/SweetAlert';
// import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-native-date-picker';

import SelectPicker from '../components/SelectPicker';
import cityData from '../utils/cityData.json';
import fortuneService from '../services/fortuneService';
import { RootStackParamList } from '../types/navigation';

// Route params tipi
type StarMapRouteProp = RouteProp<RootStackParamList, 'StarMap'>;

export default function StarMapScreen() {
  const route = useRoute<StarMapRouteProp>();
  const { advisorId, advisorPrice } = route.params;

  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [birthDate, setBirthDate] = useState(new Date());
  const [birthTime, setBirthTime] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [intention, setIntention] = useState<string>('');

  // ⬇️ Yeni picker modal anahtarları (KENDİ modalımız için)
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(birthDate);
  const [tempTime, setTempTime] = useState<Date>(birthTime);

  const cityList = cityData.map(c => ({ label: c.il, value: c.il }));
  const districtList =
    cityData.find(c => c.il === selectedCity)?.ilceler.map(d => ({ label: d, value: d })) || [];

  // SelectPicker onValueChange handlers
  const handleCityChange = (value: string | number) => {
    setSelectedCity(value as string);
    setSelectedDistrict('');
  };
  const handleDistrictChange = (value: string | number) => {
    setSelectedDistrict(value as string);
  };
  const handleGenderChange = (value: string | number) => {
    setSelectedGender(value as string);
  };

  const handleSubmit = async () => {
    if (!selectedCity || !selectedDistrict || !selectedGender) {
      setAlertMessage('Lütfen tüm alanları doldurunuz.');
      setAlertVisible(true);
      return;
    }
    try {
      setModalVisible(false);
      setLoading(true);

      await fortuneService.sendStarMapFortune({
        advisorId,
        advisorPrice,
        // tarih ISO, saat HH:mm (backend akışına uygun)
        birthDate: birthDate.toISOString(),
        birthTime: birthTime.toTimeString().slice(0, 5),
        city: selectedCity,
        district: selectedDistrict,
        gender: selectedGender,
        intention,
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
    <View style={styles.wrapper}>
      <Layout showHeader showFooter>
        <View style={styles.container}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Yıldız Haritan</Text>
            <View style={styles.titleLine} />
            <View style={styles.descriptionBox}>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>🪐</Text>
                <Text style={styles.text}>Bu yorum kişisel doğum haritanıza göre hazırlanır.</Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>🌍</Text>
                <Text style={styles.text}>Doğum yeri ve saatine göre gezegen konumları hesaplanır.</Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>🔭</Text>
                <Text style={styles.text}>Astrolojik etkilerle karakter ve yaşam potansiyelleriniz analiz edilir.</Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text style={styles.icon}>📩</Text>
                <Text style={styles.text}>Sonuç 5 dakika içinde fal geçmişinize düşer.</Text>
              </View>
            </View>
            <Image
              source={require('../assets/images/starmap.webp')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>Yorumla</Text>
          </TouchableOpacity>
        </View>
      </Layout>

      {/* Form Modal (DEĞİŞMEDİ) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrapper}
          >
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>Doğum Bilgilerin</Text>

                <Text style={styles.label}>Doğum Tarihi</Text>
                <TouchableOpacity
                  onPress={() => { setTempDate(birthDate); setDateOpen(true); }}
                  style={styles.input}
                >
                  <Text>📅 {birthDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Doğum Saati</Text>
                <TouchableOpacity
                  onPress={() => { setTempTime(birthTime); setTimeOpen(true); }}
                  style={styles.input}
                >
                  <Text>
                    ⏰ {birthTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>

                <SelectPicker
                  label="İl Seçiniz"
                  selectedValue={selectedCity}
                  onValueChange={handleCityChange}
                  items={cityList}
                />

                <SelectPicker
                  label="İlçe Seçiniz"
                  selectedValue={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  items={districtList}
                />

                <SelectPicker
                  label="Cinsiyet"
                  selectedValue={selectedGender}
                  onValueChange={handleGenderChange}
                  items={[
                    { label: 'Kadın', value: 'Kadın' },
                    { label: 'Erkek', value: 'Erkek' },
                    { label: 'Belirtmek istemiyorum', value: 'Diğer' },
                  ]}
                />

                <TextInput
                  placeholder="Niyet (isteğe bağlı)"
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={intention}
                  onChangeText={setIntention}
                  multiline
                />

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
      </Modal>

      {/* === Tarih Modalı (KENDİMİZ ÇİZDİK) === */}
      <Modal visible={dateOpen} transparent animationType="fade" onRequestClose={() => setDateOpen(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalCard}>
            <Text style={styles.dpTitle}>Tarih Seçiniz</Text>

            <DatePicker
              date={tempDate}
              mode="date"
              locale="tr"
              maximumDate={new Date()}
              onDateChange={(d) => setTempDate(d)}
               theme="light"
            />

            <View style={styles.dpButtonsRow}>
              <Pressable style={[styles.dpBtn, styles.dpBtnCancel]} onPress={() => setDateOpen(false)}>
                <Text style={styles.dpBtnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.dpBtn, styles.dpBtnConfirm]}
                onPress={() => { setBirthDate(tempDate); setDateOpen(false); }}
              >
                <Text style={styles.dpBtnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* === Saat Modalı (KENDİMİZ ÇİZDİK) === */}
      <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalCard}>
            <Text style={styles.dpTitle}>Saat Seçiniz</Text>

            <DatePicker
              date={tempTime}
              mode="time"
              locale="tr"
              is24hourSource="locale"
              onDateChange={(t) => setTempTime(t)}
               theme="light"
            />

            <View style={styles.dpButtonsRow}>
              <Pressable style={[styles.dpBtn, styles.dpBtnCancel]} onPress={() => setTimeOpen(false)}>
                <Text style={styles.dpBtnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.dpBtn, styles.dpBtnConfirm]}
                onPress={() => { setBirthTime(tempTime); setTimeOpen(false); }}
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
    borderRadius: 6
  },
  titleBox: { marginBottom: 16, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: '#5f3d9f', textAlign: 'center', paddingVertical: 10 },
  titleLine: { height: 3, backgroundColor: '#e7a96a', borderRadius: 2, marginTop: 6, marginBottom: 10 },
  descriptionBox: { marginBottom: 16, paddingHorizontal: 10 },
  descriptionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  icon: { width: 24, fontSize: 18, marginRight: 8, lineHeight: 20 },
  text: { flex: 1, fontSize: 14, color: '#5f3d9f', lineHeight: 20 },
  bannerImage: { width: '100%', height: 160, borderRadius: 10, marginTop: 10, marginBottom: 20 },
  button: { backgroundColor: '#e7a96a', paddingVertical: 12, borderRadius: 10, marginBottom: 20, width: '100%' },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },

  // Form modal (DEĞİŞMEDİ)
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  keyboardWrapper: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#5f3d9f', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, marginBottom: 4, color: '#333', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 12 },
  modalButton: { backgroundColor: '#5f3d9f', paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  modalButtonText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },

  // Date/Time custom modal stilleri (ORTADA ve temalı)
  dpModalOverlay: {
    flex: 1,
    justifyContent: 'center',  // ortada
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
    backgroundColor: '#5f3d9f', // mor
    marginRight: 6,
  },
  dpBtnCancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  dpBtnConfirm: {
    backgroundColor: '#e7a96a', // kehribar CTA
    marginLeft: 6,
  },
  dpBtnConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
