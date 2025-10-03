import api from './api';

// Kullanıcının bakiye verisini döner
export const getMyBalance = async (): Promise<number> => {
  const response = await api.get<{ balance: number }>('/user/get-my-balance');
  return response.data.balance;
};

// Kullanıcının profil bilgisini döner
export interface UserProfile {
  id: number;
  fullName: string;
  name: string;
  surname: string;
  email: string;
  birthDate?: string;
  gender?: string;
  relationshipStatus?: string;
  jobStatus?: string;
  phone?: string;
  // Diğer alanlar varsa ekleyebilirsin
}

interface GetProfileResponse {
  success: boolean;
  message?: string;
  data: UserProfile;
}

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<GetProfileResponse>('/user/get-profile');

  if (response.data?.success) {
    console.log(response.data.data);
    return response.data.data;
  } else {
    throw new Error(response.data?.message || 'Profil alınamadı.');
  }
};

// Kullanıcı profil güncelleme input tipi
export type UpdateProfileInput = Partial<UserProfile>;

interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

export const updateProfile = async (
  profileData: UpdateProfileInput
): Promise<UpdateProfileResponse> => {
  console.log(profileData);
  const response = await api.post<UpdateProfileResponse>('/user/update-profile', profileData);

  if (response.data?.success) {
    return { success: true, message: response.data.message };
  } else {
    return {
      success: false,
      message: response.data.message || 'Güncelleme başarısız',
    };
  }
};
