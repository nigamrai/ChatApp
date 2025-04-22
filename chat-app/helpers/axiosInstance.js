import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BACKEND_URL} from '@env';
// Replace <your-computer-ip> with your actual IP address
const BASE_URL = BACKEND_URL;
console.log("BASE URL",BASE_URL)
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Add an interceptor to include the token in every request
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
