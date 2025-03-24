import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Provider } from 'react-redux';
import RequireAuth from './components/Auth/requireAuth.js';
import Chat from './pages/Chat';
import FriendRequests from './pages/FriendRequests';
import Login from './pages/Login';
import SignUp from './pages/SignUp.js';
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
          name="Chat"
          options={{ title: 'Chat', headerShown: false }}
        >
          {() => (
            <RequireAuth>
              <Chat />
            </RequireAuth>
          )}
        </Stack.Screen>
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
