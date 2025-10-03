// src/components/ProfileTabs/ProfileInfoTab.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';
import { getProfile, updateProfile } from '../../services/userService';
import SweetAlert from '../SweetAlert';
import Loader from '../Loader';

type ProfileInfoTabProps = {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toYMD(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function toHM(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function tzOffsetOf(date: Date) {
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const hh = pad(Math.floor(Math.abs(off) / 60));
  const mm = pad(Math.abs(off) % 60);
  return `${sign}${hh}:${mm}`;
}
function buildLocalDateTime(datePart: Date, timePart: Date) {
  const d = new Date();
  d.setFullYear(datePart.getFullYear());
  d.setMonth(datePart.getMonth());
  d.setDate(datePart.getDate());
  d.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return d;
}

/** API’den gelebilecek farklı biçimleri güvenle "YYYY-MM-DDTHH:mm"e indirger. */
function normalizeIncomingBirthDate(raw?: string | null): string {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';

  // sentinel min date
  if (/^0001-0?1-0?1/i.test(s)) return '';

  // /Date(1693881600000)/
  const ms = s.match(/^\/Date\((\d+)\)\/$/);
  if (ms) {
    const dObj = new Date(Number(ms[1]));
    return `${toYMD(dObj)}T${toHM(dObj)}`;
  }

  // ISO (frac-second & timezone destekli)
  const iso = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+\-]\d{2}:\d{2})?)?$/
  );
  if (iso) {
    const [, y, m, d, hh, mm] = iso;
    return `${y}-${m}-${d}T${hh ? `${hh}:${mm}` : '00:00'}`;
  }

  // TR noktalı: d.M.yyyy[ HH:mm[:ss]]
  const trDot = s.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/
  );
  if (trDot) {
    const [, d, m, y, hh, mm] = trDot;
    return `${y}-${pad(Number(m))}-${pad(Number(d))}T${hh ? `${pad(Number(hh))}:${pad(Number(mm || '0'))}` : '00:00'}`;
  }

  // US slash + AM/PM: M/D/YYYY[ HH:mm[:ss]] [AM|PM]
  const usSlash = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?(?:\s*(AM|PM))?$/i
  );
  if (usSlash) {
    let [, mStr, dStr, yStr, hhStr, mmStr, ampm] = usSlash;
    const y = Number(yStr);
    const m = pad(Number(mStr));
    const d = pad(Number(dStr));
    let hh = Number(hhStr || '0');
    const mm = pad(Number(mmStr || '0'));
    if (ampm) {
      const up = ampm.toUpperCase();
      if (up === 'PM' && hh < 12) hh += 12;
      if (up === 'AM' && hh === 12) hh = 0;
    }
    return `${y}-${m}-${d}T${pad(hh)}:${mm}`;
  }

  // Slash DMY (ampm yok): D/M/YYYY[ HH:mm[:ss]]
  const dmySlash = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/
  );
  if (dmySlash) {
    const [, a, b, yStr, hhStr, mmStr] = dmySlash;
    let dNum = Number(a);
    let mNum = Number(b);
    if (dNum <= 12 && mNum > 12) { const tmp = dNum; dNum = mNum; mNum = tmp; }
    return `${yStr}-${pad(mNum)}-${pad(dNum)}T${pad(Number(hhStr || '0'))}:${pad(Number(mmStr || '0'))}`;
  }

  // Fallback
  const dObj = new Date(s.replace(' ', 'T'));
  if (!isNaN(dObj.getTime())) return `${toYMD(dObj)}T${toHM(dObj)}`;

  return '';
}

/** "YYYY-MM-DDTHH:mm" → Date (lokal) */
function parseDatePart(s: string | undefined): Date {
  if (!s) return new Date();
  const [dPart, tRaw] = s.split('T');
  if (!dPart) return new Date();
  const [y, m, d] = dPart.split('-').map(Number);
  const base = new Date();
  base.setFullYear(y || base.getFullYear());
  base.setMonth((m || 1) - 1);
  base.setDate(d || 1);
  if (tRaw) {
    const [hhStr = '0', mmStr = '0'] = tRaw.split(':');
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    base.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0);
  } else {
    base.setHours(0, 0, 0, 0);
  }
  return base;
}

export default function ProfileInfoTab({ setLoading }: ProfileInfoTabProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [birthDate, setBirthDate] = useState(''); // "YYYY-MM-DDTHH:mm"
  const [gender, setGender] = useState('');
  const [relationship, setRelationship] = useState('');
  const [jobStatus, setJobStatus] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const [openDate, setOpenDate] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const [tmpDate, setTmpDate] = useState<Date>(new Date());
  const [tmpTime, setTmpTime] = useState<Date>(new Date());

  const hasBirth = birthDate.length > 0;
  const showDate = hasBirth ? toYMD(tmpDate) : '';
  const showTime = hasBirth ? toHM(tmpTime) : '';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLocalLoading(true);
        const data = await getProfile();

        setFullName(data?.fullName ?? '');
        setEmail(data?.email ?? '');

        const normalized = normalizeIncomingBirthDate(data?.birthDate);
        setBirthDate(normalized);

        if (normalized) {
          const parsed = parseDatePart(normalized);
          setTmpDate(parsed);
          setTmpTime(parsed);
        }

        setGender(data?.gender ?? '');
        setRelationship(data?.relationshipStatus ?? '');
        setJobStatus(data?.jobStatus ?? '');
      } catch {
        setAlertMessage('Profil bilgileri alınamadı.');
        setAlertVisible(true);
      } finally {
        setLocalLoading(false);
      }
    };

    loadProfile();
  }, []);

  const onPickDatePress = () => setOpenDate(true);
  const onPickTimePress = () => setOpenTime(true);

  const handleSave = async () => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const combinedLocal = `${toYMD(tmpDate)}T${toHM(tmpTime)}`;
      const asRealDate = buildLocalDateTime(tmpDate, tmpTime);
      const combinedWithOffsetPreview = `${toYMD(asRealDate)}T${toHM(asRealDate)}${tzOffsetOf(asRealDate)}`;

      const payload = {
        birthDate: combinedLocal, // gerekirse offset’li gönder: combinedWithOffsetPreview
        gender,
        relationshipStatus: relationship,
        jobStatus,
      };

      const result = await updateProfile(payload);
      setBirthDate(combinedLocal);
      setAlertMessage(result?.message || 'Profil güncellendi.');
    } catch {
      setAlertMessage('Profil güncellenirken hata oluştu.');
    } finally {
      setLocalLoading(false);
      setLoading(false);
      setAlertVisible(true);
    }
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {localLoading && <Loader visible={true} />}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput value={fullName} editable={false} style={styles.disabledInput} />

        <Text style={styles.label}>E-posta</Text>
        <TextInput value={email} editable={false} style={styles.disabledInput} />

        <Text style={styles.label}>Doğum Tarihi</Text>
        <Pressable onPress={onPickDatePress} style={styles.input}>
          <Text>{showDate || 'Tarih seçiniz'}</Text>
        </Pressable>

        <Text style={styles.label}>Doğum Saati</Text>
        <Pressable onPress={onPickTimePress} style={styles.input}>
          <Text>{showTime || 'Saat seçiniz'}</Text>
        </Pressable>

        <Text style={styles.label}>Cinsiyet</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={gender} onValueChange={(v) => setGender(v)}>
            <Picker.Item label="Seçiniz" value="" />
            <Picker.Item label="Kadın" value="Kadın" />
            <Picker.Item label="Erkek" value="Erkek" />
            <Picker.Item label="Belirtmek istemiyorum" value="Belirtmek istemiyorum" />
          </Picker>
        </View>

        <Text style={styles.label}>İlişki Durumu</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={relationship} onValueChange={(v) => setRelationship(v)}>
            <Picker.Item label="Seçiniz" value="" />
            <Picker.Item label="İlişkisi var" value="İlişkisi var" />
            <Picker.Item label="Nişanlı" value="Nişanlı" />
            <Picker.Item label="Evli" value="Evli" />
            <Picker.Item label="İlişkisi yok" value="İlişkisi yok" />
            <Picker.Item label="Boşanmış" value="Boşanmış" />
            <Picker.Item label="Dul" value="Dul" />
            <Picker.Item label="Platonik" value="Platonik" />
            <Picker.Item label="Ayrılmış" value="Ayrılmış" />
          </Picker>
        </View>

        <Text style={styles.label}>İş Durumu</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={jobStatus} onValueChange={(v) => setJobStatus(v)}>
            <Picker.Item label="Seçiniz" value="" />
            <Picker.Item label="Çalışıyor" value="Çalışıyor" />
            <Picker.Item label="Okuyor" value="Okuyor" />
            <Picker.Item label="İş arıyor" value="İş arıyor" />
            <Picker.Item label="İlgilenmiyor" value="İlgilenmiyor" />
            <Picker.Item label="İş sahibi" value="İş sahibi" />
          </Picker>
        </View>

        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </Pressable>

        <SweetAlert
          visible={alertVisible}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </ScrollView>

      {/* 📅 Tarih */}
      <Modal visible={openDate} transparent animationType="fade" onRequestClose={() => setOpenDate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tarih Seçiniz</Text>

            <DatePicker
              date={tmpDate}
              mode="date"
              maximumDate={new Date()}
              locale="tr"
              onDateChange={(d) => setTmpDate(d)}
              theme="light"
            />

            <View style={styles.modalButtonsRow}>
              <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => setOpenDate(false)}>
                <Text style={styles.btnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnConfirm]}
                onPress={() => {
                  setOpenDate(false);
                  setBirthDate(`${toYMD(tmpDate)}T${toHM(tmpTime)}`);
                }}
              >
                <Text style={styles.btnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ⏰ Saat */}
      <Modal visible={openTime} transparent animationType="fade" onRequestClose={() => setOpenTime(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Saat Seçiniz</Text>

            <DatePicker
              date={tmpTime}
              mode="time"
              is24hourSource="locale"
              locale="tr"
              onDateChange={(d) => setTmpTime(d)}
              theme="light"
            />

            <View style={styles.modalButtonsRow}>
              <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => setOpenTime(false)}>
                <Text style={styles.btnCancelText}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnConfirm]}
                onPress={() => {
                  setOpenTime(false);
                  setBirthDate(`${toYMD(tmpDate)}T${toHM(tmpTime)}`);
                }}
              >
                <Text style={styles.btnConfirmText}>Tamam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  content: { width: '100%', paddingHorizontal: 10 },
  label: { marginTop: 5, fontSize: 13, fontWeight: '600', color: '#5f3d9f' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, marginTop: 2, backgroundColor: '#fff',
  },
  disabledInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 3, fontSize: 16, marginTop: 2,
    backgroundColor: '#eee', color: '#999',
  },
  pickerWrapper: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10, height: 40,
    backgroundColor: '#fff', marginTop: 2, overflow: 'hidden', justifyContent: 'center',
  },
  saveButton: { backgroundColor: '#e7a96a', paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000055' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, width: '90%' },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333', textAlign: 'left' },
  modalButtonsRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnCancel: { backgroundColor: '#5f3d9f', marginRight: 6 },
  btnCancelText: { color: '#fff', fontWeight: '600' },
  btnConfirm: { backgroundColor: '#e7a96a', marginLeft: 6 },
  btnConfirmText: { color: '#fff', fontWeight: '700' },
});
