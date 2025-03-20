import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Provider } from 'react-redux';
import RequireAuth from './components/Auth/requireAuth.js';
import Chat from './pages/Chat'; // Import the Chat component
import FriendRequests from './pages/FriendRequests'; // Correct the import to match the component name
import Login from './pages/Login'; // Make sure the path is correct
import SignUp from './pages/SignUp'; // Make sure the path is correct
import store from './redux/store';
const Stack = createStackNavigator();

function App() {
  // const dispatch = useDispatch();
  // const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

  // useEffect(() => {
  //   const checkSession = async () => {
  //     const token = await AsyncStorage.getItem('session_token');
  //     if (token) {
  //       // Fetch user data using the token and dispatch setUser action
  //       const userData = await fetchUserData(token); // Implement fetchUserData function
  //       dispatch(setUser({ user: userData }));
  //     }
  //   };
  //   console.log("checkSession")
  //   checkSession();
  // }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: 'Login', headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUp}
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen
          name="FriendRequests"
          component={() => (
            <RequireAuth>
              <FriendRequests />
            </RequireAuth>
          )}
          options={{ title: 'Friend Requests' ,headerShown: false}}
        />
        <Stack.Screen
          name="Chat"
          component={() => (
            <RequireAuth>
              <Chat />
            </RequireAuth>
          )}
          options={{ title: 'Chat', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}