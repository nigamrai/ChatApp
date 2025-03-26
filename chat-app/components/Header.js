import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome
import { useDispatch } from 'react-redux'; // Import useDispatch
import { clearUser } from '../redux/userSlice'; // Import logout action

const Header = ({ user }) => {
  const navigation = useNavigation(); // Initialize navigation
  const dispatch = useDispatch(); // Initialize dispatch for Redux

  const handleLogout = () => {
    dispatch(clearUser()); // Dispatch logout action
    navigation.navigate('Login'); // Navigate to login screen
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
        <Text style={styles.title}>Nep Chat</Text>
      </TouchableOpacity>
      <View style={styles.icons}>
        {/* <FontAwesome name="comment-o" size={24} color="black" style={styles.icon} /> */}
        <TouchableOpacity onPress={() => navigation.navigate('Message')}>
          <FontAwesome name="comment-o" size={24} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('FriendRequests')}>
          <FontAwesome name="users" size={24} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:'30'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#f44336', // Red color for logout button
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  logoutButtonText: {
    color: '#fff',
  },
});

export default Header;
