import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Header from '../components/Header'; // Import Header component
import axiosInstance from '../helpers/AxiosInstance';

const FriendRequests = () => {
  const { data } = useSelector((auth) => auth.user); // Get user data from Redux
  const [requests, setRequests] = useState([]); // State to store friend requests

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axiosInstance.get('/auth/friend-requests'); // Fetch friend requests from API
        setRequests(response.data); // Set requests in state
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    fetchRequests();
  }, []);

  const acceptRequest = async (requestId) => {
    try {
      const response = await axiosInstance.post(`/auth/accept-request/${requestId}`); // Accept friend request
      if (response.status === 200) {
        setRequests((prev) => prev.filter((request) => request._id !== requestId)); // Remove accepted request from state
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestText}>{item.from.name}</Text>
      <TouchableOpacity onPress={() => acceptRequest(item._id)} style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header user={data} /> {/* Use Header component */}
      <Text style={styles.title}>Friend Requests</Text>
      <FlatList 
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={item => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  requestText: {
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
  },
  acceptButtonText: {
    color: '#fff',
  },
});

export default FriendRequests;
