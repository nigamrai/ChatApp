import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import RequireAuth from './components/Auth/requireAuth.js';

import Chat from './pages/Chat';
import Chatting from './pages/Chatting.js';
import FriendRequests from './pages/FriendRequests';
import Login from './pages/Login';
import Message from './pages/Message.js';
import SignUp from './pages/SignUp.js';
import VerifyOtpPage from './pages/VerifyOtpPage.js';
import store from './redux/store';
const Stack = createStackNavigator();

function App() {

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
          options={{ title: 'Friend Requests', headerShown: false }}
        >
          {() => (
            <RequireAuth>
              <FriendRequests />
            </RequireAuth>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Message"
          options={{ title: 'Message', headerShown: false }}
        >
          {() => (
            <RequireAuth>
              <Message />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Chat"
          options={{ title: 'Chat', headerShown: false }}
        >
          {() => (
            <RequireAuth>
              <Chat />
            </RequireAuth>
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Chatting"
          options={{ title: 'Chatting', headerShown: false }}
        >
          {() => (
            <RequireAuth>
              <Chatting />
            </RequireAuth>
          )}
        </Stack.Screen>
       
        <Stack.Screen
          name="VerifyOtpPage"
          component={VerifyOtpPage}
          options={{ title: 'Verify OTP', headerShown: false }}
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
