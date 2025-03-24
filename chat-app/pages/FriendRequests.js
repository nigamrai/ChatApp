import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Header from '../components/Header'; // Import Header component
import axiosInstance from '../helpers/axiosInstance.js';

const FriendRequests = () => {
  const { data } = useSelector((auth) => auth.user); // Get user data from Redux
  const [requests, setRequests] = useState([]); // State to store friend requests
  const [acceptedRequests, setAcceptedRequests] = useState({}); // Track accepted friend requests
  console.log("User data: "+data._id);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!data) return; // Check if user is logged in
      try {
        const response = await axiosInstance.get(`/auth/friend-requests/${data._id}`);
        console.log(response.data); // Fetch friend requests from API
        setRequests(response.data); // Set requests in state
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    fetchRequests();
  }, []); // Add data as a dependency

  const acceptRequest = async (senderId) => {
    try {
      console.log("User data"+data._id)
      console.log("Sender data"+senderId)
      const response = await axiosInstance.post(`/auth/friend-request/accept`, { requestId:data._id, senderId }); // Accept friend request
      if (response.status === 200) {
        setAcceptedRequests((prev) => ({ ...prev, [senderId]: true }));
        setRequests((prev) => prev.filter((request) => request._id !== senderId)); // Remove accepted request from state
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <Text style={styles.requestText}>{item.from.name}</Text>
        <Text style={styles.requestEmail}>{item.from.email}</Text>
      </View>
      <TouchableOpacity
        onPress={acceptedRequests[item.from._id] ? null : () => acceptRequest(item.from._id)}
        style={[
          styles.acceptButton,
          acceptedRequests[item.from._id] && styles.acceptedButton,
        ]}
      >
        <Text style={styles.acceptButtonText}>
          {acceptedRequests[item.from._id] ? 'Friends' : 'Accept'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Header user={data} /> 
      </View>
      <Text style={styles.title}>Friend Requests</Text>
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item._id.toString()}
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
  headerContainer: {
    // Add necessary styling to maintain layout
    marginBottom: 20,
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
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  requestText: {
    fontWeight: 'bold',
  },
  requestEmail: {
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
  },
  acceptedButton: {
    backgroundColor: 'blue',
  },
  acceptButtonText: {
    color: '#fff',
  },
});

export default FriendRequests;
