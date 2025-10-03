import AsyncStorage from '@react-native-async-storage/async-storage';

// 📦 Access Token işlemleri
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('accessToken', token);
  } catch (error) {
    console.error('Token kaydedilemedi:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Token alınamadı:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('last_push_register_token_v1');
  } catch (error) {
    console.error('Token silinemedi:', error);
  }
};

// 🔁 Refresh Token işlemleri
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('refreshToken', refreshToken);
  } catch (error) {
    console.error('Refresh token kaydedilemedi:', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch (error) {
    console.error('Refresh token alınamadı:', error);
    return null;
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('last_push_register_token_v1');
  } catch (error) {
    console.error('Refresh token silinemedi:', error);
  }
};
