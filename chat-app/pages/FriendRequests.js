import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import axiosInstance from '../helpers/axiosInstance.js';

const FriendRequests = () => {
  const { data } = useSelector((auth) => auth.user); // User data from Redux
  const [requests, setRequests] = useState([]); // Friend requests list
  const [acceptedRequests, setAcceptedRequests] = useState({}); // Accepted requests state
  const [rejectedRequests, setRejectedRequests] = useState({}); // Rejected requests state

  // Fetch friend requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!data) return;
      try {
        const response = await axiosInstance.get(`/auth/friend-requests/${data._id}`);
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching friend requests:', error.response?.data || error.message);
      }
    };

    fetchRequests();
  }, [data]);

  // Accept friend request
  const acceptRequest = async (senderId) => {
    try {
      const response = await axiosInstance.post(`/auth/friend-request/accept`, {
        requestId: data._id, // The recipient's ID
        senderId, // The sender's ID
      });

      if (response.status === 200) {
        setAcceptedRequests((prev) => ({ ...prev, [senderId]: true }));
        setRequests((prev) => prev.filter((request) => request.from._id !== senderId));
      }
    } catch (error) {
      console.error('Error accepting friend request:', error.response?.data || error.message);
    }
  };

  // Reject friend request
  const rejectRequest = async (senderId) => {
    try {
      const response = await axiosInstance.delete(`/auth/friend-request/reject`, {
        data: {
          requestId: data._id, // The recipient's ID
          senderId, // The sender's ID
        },
      });

      if (response.status === 200) {
        setRejectedRequests((prev) => ({ ...prev, [senderId]: true }));
        setRequests((prev) => prev.filter((request) => request.from._id !== senderId));
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error.response?.data || error.message);
    }
  };

  // Render each friend request
  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
       <Image
        source={{ uri: item.from.image?.secure_url }} // Directly use the image URL if available
        style={styles.profilePic}
      />
      <View style={styles.userInfo}>
        <Text style={styles.requestText}>{item.from.name}</Text>
        <Text style={styles.requestEmail}>{item.from.email}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={acceptedRequests[item.from._id] ? null : () => acceptRequest(item.from._id)}
          style={[styles.acceptButton, acceptedRequests[item.from._id] && styles.acceptedButton]}
        >
          <Text style={styles.acceptButtonText}>
            {acceptedRequests[item.from._id] ? 'Friends' : 'Accept'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={rejectedRequests[item.from._id] ? null : () => rejectRequest(item.from._id)}
          style={[styles.rejectButton, rejectedRequests[item.from._id] && styles.rejectedButton]}
        >
          <Text style={styles.rejectButtonText}>
            {rejectedRequests[item.from._id] ? 'Rejected' : 'Reject'}
          </Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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
  rejectButton: {
    backgroundColor: '#D32F2F',
    padding: 5,
    borderRadius: 5,
  },
  rejectedButton: {
    backgroundColor: 'gray',
  },
  rejectButtonText: {
    color: '#fff',
  },
});

export default FriendRequests;
