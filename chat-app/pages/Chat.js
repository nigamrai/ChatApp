import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import axiosInstance from '../helpers/axiosInstance.js';
import { clearUser } from '../redux/userSlice';

const Chat = () => {
  const { data } = useSelector((auth) => auth.user);
  const [users, setUsers] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/auth/users');
        const usersWithFriendStatus = response.data.map(userItem => ({
          ...userItem,
          isFriend: data.friends.includes(userItem._id),
        }));
        setUsers(usersWithFriendStatus);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
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

  const cancelFriendRequest = async (friendId) => {
    try {
      const response = await axiosInstance.post('/auth/cancel-request', {
        from: data._id,
        to: friendId,
      });
      if (response.status === 200) {
        setRequestStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[friendId];
          return newStatus;
        });
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const handleLogout = () => {
    dispatch(clearUser());
    navigation.navigate('Login');
  };

  const renderUserItem = ({ item }) => {
    if (item.email === data.email) return null;

    const isRequestSent = requestStatus[item._id] === 'Request Sent';

    return (
      <View style={styles.userItem} key={item._id}>
        <Image source={{ uri: item.image.secure_url }} style={styles.profilePic} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        {item.isFriend ? (
          <TouchableOpacity style={[styles.button, styles.friendButton]} disabled>
            <Text style={[styles.buttonText, styles.friendButtonText]}>Friends</Text>
          </TouchableOpacity>
        ) : isRequestSent ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={[styles.button, styles.requestSentButton]} disabled>
              <Text style={styles.buttonText}>Request Sent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => cancelFriendRequest(item._id)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.button, styles.addButton]} onPress={() => sendFriendRequest(item._id)}>
            <Text style={styles.buttonText}>Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header user={data} />
      <View style={styles.welcomeSection}>
        <Image source={{ uri: data?.image?.secure_url }} style={styles.profilePic} />
        <Text style={styles.welcomeText}>Welcome, {data.name}!</Text>
      </View>
      <Text style={styles.sectionTitle}>Users on Nep Chat</Text>
      <FlatList
        data={users.filter(userItem => userItem.email !== data.email)}
        renderItem={renderUserItem}
        keyExtractor={item => item._id || item.email}
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  button: {
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 2,
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
  cancelButton: {
    backgroundColor: '#f44336',
  },
  friendButtonText: {
    color: 'white',
  },
  buttonText: {
    color: 'white',
  },
});

export default Chat;
