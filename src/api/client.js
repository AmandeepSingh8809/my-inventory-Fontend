import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Node.js backend
export const API_BASE_URL = 'http://192.168.1.134:5000';

// Image server
export const IMAGE_BASE_URL = 'http://192.168.1.134:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const activeShop = await AsyncStorage.getItem('activeShopCode');

      if (activeShop) {
        config.headers['x-shop-code'] = activeShop;
      }

      console.log('API REQUEST:', {
        method: config.method,
        url: `${config.baseURL}${config.url}`,
      });

      return config;
    } catch (error) {
      console.log('INTERCEPTOR ERROR:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API RESPONSE:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('API ERROR:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  return `${IMAGE_BASE_URL}${imagePath}`;
};

export default api;