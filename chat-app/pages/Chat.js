import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux'; // Import useDispatch
import Header from '../components/Header'; // Import Header component
import axiosInstance from '../helpers/axiosInstance.js';
import { clearUser } from '../redux/userSlice'; // Import logout action

const Chat = () => {
  const { data } = useSelector((auth) => auth.user); // Get user data from Redux
  const [users, setUsers] = useState([]); // State to store users
  const [requestStatus, setRequestStatus] = useState({}); // Track request status for each user
  const navigation = useNavigation(); // Initialize navigation
  const dispatch = useDispatch(); // Initialize dispatch for Redux

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/auth/users'); // Fetch users from API
        const usersWithFriendStatus = response.data.map(userItem => ({
          ...userItem,
          isFriend: data.friends.includes(userItem._id), // Check if the user is a friend
        }));
        setUsers(usersWithFriendStatus); // Set users with friend status in state
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Set the request status for each user
    const requestStatusData = {};
    users.forEach(userItem => {
      userItem.requests.forEach(request => {
        if (request.from === data._id) {
          requestStatusData[userItem._id] = 'Request Sent';
        }
      });
    });
    setRequestStatus(requestStatusData);
  }, [users, data]);

  const sendFriendRequest = async (friendId) => {
    try {
      const response = await axiosInstance.post('/auth/friend-request', {
        from: data._id,
        to: friendId,
      });
      if (response.status === 200) {
        setRequestStatus((prev) => ({ ...prev, [friendId]: 'Request Sent' }));
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleLogout = () => {
    dispatch(clearUser); // Dispatch logout action
    navigation.navigate('Login'); // Navigate to login screen
  };

  const renderUserItem = ({ item }) => {
    if (item.email === data.email) {
      return null; // Exclude logged-in user from the list
    }
    return (
      <View style={styles.userItem} key={item.id ? item.id : item.email}>
        <Image source={{ uri: item.image.secure_url }} style={styles.profilePic} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, item.isFriend ? styles.friendButton : requestStatus[item._id] ? styles.requestSentButton : styles.addButton]}
          onPress={requestStatus[item._id] || item.isFriend ? null : () => sendFriendRequest(item._id)} // Disable onPress if request is sent or already friends
        >
          <Text style={[styles.buttonText, item.isFriend ? styles.friendButtonText : null]}>
            {item.isFriend ? 'Friends' : requestStatus[item._id] || 'Add Friend'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header user={data} />
      <View style={styles.welcomeSection}>
        <Image source={{ uri: data.profilePic }} style={styles.profilePic} />
        <Text style={styles.welcomeText}>Welcome, {data.name}!</Text>
      </View>
      <Text style={styles.sectionTitle}>Users on Nep Chat</Text>
      <FlatList
        data={users.filter(userItem => userItem.email !== data.email)} // Ensure logged-in user is filtered out
        renderItem={renderUserItem}
        keyExtractor={item => item._id ? item._id.toString() : item.email} // Fallback to email if id is undefined
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    backgroundColor: '#f7f7f7',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
  },
  button: {
    padding: 5,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  requestSentButton: {
    backgroundColor: 'gray',
  },
  friendButton: {
    backgroundColor: 'blue',
  },
  friendButtonText: {
    color: 'white', // Set text color to white for the "Friends" button
  },
  buttonText: {
    color: 'black', // Default text color
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default Chat;
