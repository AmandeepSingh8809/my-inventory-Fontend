import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// 1. Your API Server (Where Node.js runs)
export const API_BASE_URL = 'http://192.168.1.88:5000'; 

// 2. Your Image Server
export const IMAGE_BASE_URL = 'http://192.168.1.88:5000'; 

// 3. Create your Axios API client pointing ONLY to the API server
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 🚨 THE MAGIC: Axios Request Interceptor
api.interceptors.request.use(
  async (config) => {
    // 1. Grab the token from the phone's storage
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🚨 NEW: 2. Grab the active shop code from the phone's storage
    const activeShop = await AsyncStorage.getItem('activeShopCode');
    if (activeShop) {
      config.headers['x-shop-code'] = activeShop;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Create your image helper pointing ONLY to the Image server
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) return imagePath; 
  
  return `${IMAGE_BASE_URL}${imagePath}`;
};

export default api;