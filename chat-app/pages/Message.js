import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import axiosInstance from '../helpers/axiosInstance.js';
import { clearUser } from '../redux/userSlice';

const Message = () => {
  const { data } = useSelector((auth) => auth.user); 
  const [users, setUsers] = useState([]); 
  const navigation = useNavigation(); 
  const dispatch = useDispatch(); 

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/auth/users'); 
        const friendsList = response.data.filter(userItem => data.friends.includes(userItem._id)); // Filter only friends
        setUsers(friendsList); 
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [data.friends]);

  const handleLogout = () => {
    dispatch(clearUser()); 
    navigation.navigate('Login'); 
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem} key={item._id}>
      <Image source={{ uri: item.image.secure_url }} style={styles.profilePic} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {/* <Text style={styles.userEmail}>{item.email}</Text> */}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header user={data} />
      <View style={styles.welcomeSection}>
        <Image source={{ uri: data?.image?.secure_url }} style={styles.profilePic} />
        <Text style={styles.welcomeText}>Welcome, {data.name}!</Text>
      </View>
      <Text style={styles.sectionTitle}>Your Friends</Text>
      <FlatList
        data={users} // Only friends are displayed
        renderItem={renderUserItem}
        keyExtractor={item => item._id.toString()} 
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

export default Message;
