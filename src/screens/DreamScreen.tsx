import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import SweetAlert from '../components/SweetAlert';
import { useRoute, RouteProp } from '@react-navigation/native';
import fortuneService from '../services/fortuneService';
import { RootStackParamList } from '../types/navigation';

type DreamScreenRouteProp = RouteProp<RootStackParamList, 'Dream'>; // 'Dream' ekranının RootStackParamList'te tanımlı olması lazım

export default function DreamScreen() {
  const route = useRoute<DreamScreenRouteProp>();
  const { advisorId, advisorPrice } = route.params!; // kesin var olarak belirtiyoruz

  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleSubmit = async () => {
    if (!dreamText.trim()) {
      setAlertMessage('Lütfen rüyanızı yazınız.');
      setAlertVisible(true);
      return;
    }

    const startTime = Date.now();
    setLoading(true);

    try {
      await fortuneService.sendDreamFortune({
        advisorId,
        advisorPrice,
        dreamText,
      });

      setAlertMessage(
        'İsteğiniz alındı. Yorumunuz kısa sürde hazır olacak.'
      );
    } catch (err: any) {
      console.error('Hata:', err);
      setAlertMessage(err.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      const elapsed = Date.now() - startTime;
      const wait = Math.max(300 - elapsed, 0);
      setTimeout(() => {
        setLoading(false);
        setAlertVisible(true);
      }, wait);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Layout showHeader showFooter>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.titleBox}>
              <Text style={styles.title}>Rüya Rehberi</Text>
              <View style={styles.titleLine} />
              <View style={styles.descriptionBox}>
                <View style={styles.descriptionRow}>
                  <Text style={styles.icon}>🌙</Text>
                  <Text style={styles.text}>
                    Rüyanızı detaylı bir şekilde yazın. Uzunluk ve ayrıntı, yorumun kalitesini artırır.
                  </Text>
                </View>
                <View style={styles.descriptionRow}>
                  <Text style={styles.icon}>🔮</Text>
                  <Text style={styles.text}>
                    Yorumcu, sembolleri ve anlamları rüyanızın bağlamında analiz edecektir.
                  </Text>
                </View>
                <View style={styles.descriptionRow}>
                  <Text style={styles.icon}>📩</Text>
                  <Text style={styles.text}>Yorum 5 dakika içinde fal geçmişinize düşer.</Text>
                </View>
                <View style={styles.descriptionRow}>
                  <Text style={styles.icon}>💎</Text>
                  <Text style={styles.text}>{advisorPrice} ametist taşı harcanacak.</Text>
                </View>
              </View>
            </View>

            <TextInput
              placeholder="Rüyanızı detaylı bir şekilde yazınız..."
              style={styles.input}
              value={dreamText}
              onChangeText={setDreamText}
              multiline
              maxLength={2000}
            />
            <Text style={styles.charCount}>{dreamText.length} / 2000 karakter</Text>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Yorumla</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Layout>

      {loading && <Loader visible />}
      <SweetAlert visible={alertVisible} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#FAEFE6',
    flexGrow: 1,
  },
  titleBox: {
    marginBottom: 16,
    textAlign: 'center',
  },
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
  descriptionBox: {
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  icon: {
    width: 24,
    fontSize: 18,
    marginRight: 8,
    lineHeight: 20,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#5f3d9f',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  charCount: {
    textAlign: 'right',
    color: '#5f3d9f',
    fontSize: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e7a96a',
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});
