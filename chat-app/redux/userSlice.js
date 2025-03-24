import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  data: {},
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      AsyncStorage.setItem('token', action.payload.token); // Store the token

      if (action?.payload) {
        AsyncStorage.setItem('data', JSON.stringify(action?.payload?.user));
        AsyncStorage.setItem('isLoggedIn', 'true');
        state.isLoggedIn = true;
        state.data = action?.payload?.user;
      }
    },
    clearUser: (state) => {
      AsyncStorage.removeItem('token'); // Remove the token

      AsyncStorage.removeItem('data');
      AsyncStorage.removeItem('isLoggedIn');
      state.isLoggedIn = false;
      state.data = {};
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
