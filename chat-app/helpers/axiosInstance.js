import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Replace <your-computer-ip> with your actual IP address
const BASE_URL = 'http://10.10.10.15:5000/api/';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Add an interceptor to include the token in every request
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('session_token');
  console.log(token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
