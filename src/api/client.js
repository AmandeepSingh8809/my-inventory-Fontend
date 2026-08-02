import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🚨 NEW: Import AsyncStorage

// 1. Your API Server (Where Node.js runs)
export const API_BASE_URL = 'http://192.168.1.160:5000'; // Change to production API URL later

// 2. Your Image Server (CDN, AWS S3, or a separate static server)
// For local development, this can just be the same as API_BASE_URL.
// For production, change this to your cloud storage URL!
export const IMAGE_BASE_URL = 'http://192.168.1.160:5000'; 

// 3. Create your Axios API client pointing ONLY to the API server
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 🚨 THE MAGIC: Axios Request Interceptor
api.interceptors.request.use(
  async (config) => {
    // Before the request is sent, grab the token from the phone's storage
    const token = await AsyncStorage.getItem('userToken');
    
    // If a token exists, attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  
  // If the path already includes http (e.g., an external Google Image link), return it directly
  if (imagePath.startsWith('http')) return imagePath; 
  
  // Otherwise, attach your dedicated Image Server URL!
  return `${IMAGE_BASE_URL}${imagePath}`;
};

export default api;