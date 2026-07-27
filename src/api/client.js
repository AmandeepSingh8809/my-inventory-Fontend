import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your computer's IP
const API_BASE_URL = 'http://192.168.1.84:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// React Native Async Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Use AsyncStorage instead of localStorage in React Native
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading auth token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;