import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Image } from 'react-native';
import { getToken } from '../utils/storage';
import api from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type InitScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Init'>;

type Props = {
  navigation: InitScreenNavigationProp;
};

export default function InitScreen({ navigation }: Props) {
  useEffect(() => {
    const checkLogin = async () => {
      const token = await getToken();
      if (token) {
        try {
          await api.get('/auth/me');
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        } catch {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };

    checkLogin();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.webp')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#5f3d9f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAEFE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
});
