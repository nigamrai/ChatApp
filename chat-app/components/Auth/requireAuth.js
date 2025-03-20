import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react'; // Import useEffect
import { useSelector } from 'react-redux';

const RequireAuth = ({ children }) => {
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const navigation = useNavigation(); // Define navigation at the top

  useEffect(() => {
const checkToken = async () => {
  const token = await AsyncStorage.getItem('session_token');
  console.log("Require Auth Token", AsyncStorage.getItem('session_token'));
  if (!token) {
    navigation.navigate('Login'); // Redirect to login if token is not found
  } else{
    return;
  }
};


    checkToken();
  }, [isLoggedIn, navigation]); // Add isLoggedIn to the dependency array

  return children; // Render children if logged in
};

export default RequireAuth;
