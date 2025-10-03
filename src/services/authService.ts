// src/services/authService.ts (FULL)
import api from './api';
import { removeToken, removeRefreshToken } from '../utils/storage';
import { registerDeviceToken } from './pushService';

// Kullanıcı modeli (örnek)
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Login parametreleri
interface LoginParams {
  email: string;
  password: string;
  appVersion: string;
  deviceInfo: string;
  ipAddress: string | null;
}

// Register parametreleri
interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  privacyConsent: boolean;
}

// Google Login
interface GoogleLoginParams {
  idToken: string;
  deviceInfo: string;
  appVersion: string;
  ipAddress: string | null;
  privacyConsent?: boolean;
  privacyPolicyVersion?: string;
}

// Reset Code
interface ResetCodeParams {
  email: string;
  code: string;
}

// Reset Password
interface ResetPasswordParams {
  email: string;
  resetToken: string;
  newPassword: string;
}

// 🔐 Login
export const login = (
  email: string,
  password: string,
  appVersion: string,
  deviceInfo: string,
  ipAddress: string | null
) => {
  return api.post('/auth/login', {
    email,
    password,
    appVersion,
    deviceInfo,
    ipAddress,
  });
};

// 🧾 Register
export const register = async ({ firstName, lastName, email, password, privacyConsent }: RegisterParams) => {
  const response = await api.post('/auth/register', {
    firstName,
    lastName,
    email,
    password,
    privacyConsent,
  });
  return response.data;
};

// 🙋‍♂️ Me
export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (error: any) {
    return null;
  }
}

// 🔑 Google login (opsiyonel consent alanları destekli)
export const loginWithGoogle = ({
  idToken,
  deviceInfo,
  appVersion,
  ipAddress,
  privacyConsent,
  privacyPolicyVersion,
}: GoogleLoginParams) => {
  return api.post('/auth/google', {
    idToken,
    deviceInfo,
    appVersion,
    ipAddress,
    ...(privacyConsent !== undefined ? { privacyConsent } : {}),
    ...(privacyPolicyVersion ? { privacyPolicyVersion } : {}),
  });
};

// ---------------------------------------------
// Şifre sıfırlama işlemleri
// ---------------------------------------------

// 1. Mail gönder (reset kodu)
export const requestPasswordReset = (email: string) => {
  return api.post('/auth/request-reset', { email });
};

// 2. Kod doğrula ve reset token al
export const vResetCode = ({ email, code }: ResetCodeParams) => {
  return api.post('/auth/verify-reset', { email, code });
};

// 3. Yeni şifreyi kaydet
export const resetPassword = ({ email, resetToken, newPassword }: ResetPasswordParams) => {
  return api.post('/auth/reset-password', {
    email,
    resetToken,
    newPassword,
  });
};

// 🚪 Logout
export const logout = async () => {
  try {
    await removeToken();
    await removeRefreshToken();
    return true;
  } catch {
    return false;
  }
};

// ❌ Hesap silme
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/user/delete-account');
    if (response.data?.success) {
      await removeToken();
      await removeRefreshToken();
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// ♻️ Hesap yeniden aktifleştirme
export const reactivateAccount = async (email: string) => {
  const response = await api.post('/auth/reactivate-account', { email });
  return response.data;
};

// ✅ Login başarıdan sonra tek sefer push senkronu (tokenler kaydedildikten SONRA çağır)
export async function syncPushAfterLogin(): Promise<void> {
  await registerDeviceToken();
}
