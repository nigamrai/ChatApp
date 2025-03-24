import axios from 'axios';

const BASE_URL = 'http://10.10.10.183:5000/api';
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});
export default axiosInstance;