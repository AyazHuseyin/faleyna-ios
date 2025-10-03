// src/services/rewardService.ts
import api from './api';
import { TestIds } from 'react-native-google-mobile-ads';

export const getRewardStatus = async () => {
  try {
    const res = await api.get('/rewards/status');
    return res.data; // { canWatch, remaining } veya { canWatchAd, remainingQuota } gibi dönebilir
  } catch (error) {
    console.error('Ödül durumu alınamadı:', error);
    throw new Error('Ödül durumu alınamadı.');
  }
};

/** 🟢 Reklam izleme karşılığında ödül kazan */
export const watchAdReward = async () => {
  try {
    const res = await api.post('/rewards/watch');
    return res.data; // { success: true, amount: number } vb.
  } catch (error) {
    console.error('Reklam izleme hatası:', error);
    throw new Error('Reklam izlenemedi.');
  }
};
