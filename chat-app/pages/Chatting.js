import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import axiosInstance from "../helpers/axiosInstance.js";
import RtcEngine, { ChannelProfile, ClientRole, RtcLocalView, RtcRemoteView } from 'react-native-agora';
import {BACKEND_URL} from '@env';
const AGORA_APP_ID = null; // Will be set dynamically from backend

const Chatting = () => {
  const data = useSelector((auth) => auth.user);
  const route = useRoute();
  const { friend } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const navigation = useNavigation();
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [channel, setChannel] = useState('testchannel');
  const [uid, setUid] = useState(Math.floor(Math.random() * 10000));
  const [engine, setEngine] = useState(null);
  const [appId, setAppId] = useState(null);
  const [token, setToken] = useState(null);
  const [remoteUids, setRemoteUids] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  // --- STATE FOR CALL MODALS ---
  const [callRequest, setCallRequest] = useState(null); // { from, callType, roomId }
  const [calling, setCalling] = useState(false);
  const [callRejected, setCallRejected] = useState(false);
  
  useEffect(() => {
    console.log("URL For socket connection",BACKEND_URL)
    // Initialize socket connection
    socketRef.current = io("http://192.168.121.46:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });

    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(
          `/messages/${data.data._id}/${friend._id}`
        );
        setMessages(response?.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    // Join user's room on connect
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      socketRef.current.emit("join", data.data._id);
      socketRef.current.emit("register", data.data._id); // Register user for call signaling
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    // Message handling
    const handleIncomingMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    // Add event listeners
    socketRef.current.on("message", handleIncomingMessage);

    // Listen for incoming call events
    if (socketRef.current) {
      socketRef.current.on('call:incoming', ({ from, callType, roomId }) => {
        navigation.navigate('CallScreen', {
          isCaller: false,
          roomId,
          selfId: data.data._id,
          remoteId: from,
          callType,
        });
      });
    }

    // Listen for incoming call requests
    if (socketRef.current) {
      socketRef.current.on('call:request', ({ from, callType, roomId }) => {
        setCallRequest({ from, callType, roomId });
      });
      socketRef.current.on('call:accepted', ({ roomId, callType, from }) => {
        setCalling(false);
        navigation.navigate('CallScreen', {
          isCaller: false,
          roomId,
          selfId: data.data._id,
          remoteId: from,
          callType,
        });
      });
      socketRef.current.on('call:rejected', () => {
        setCalling(false);
        setCallRejected(true);
        setTimeout(() => setCallRejected(false), 2000);
      });
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off("message", handleIncomingMessage);
        socketRef.current.off('call:incoming');
        socketRef.current.off('call:request');
        socketRef.current.off('call:accepted');
        socketRef.current.off('call:rejected');
        socketRef.current.disconnect();
      }
    };
  }, [friend, data.data._id]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const messageData = {
        senderId: data.data._id,
        recipientId: friend._id,
        message: newMessage,
        messageType: "text",
      };

      // Optimistic update
      setMessages((prev) => [...prev, messageData]);
      setNewMessage("");

      try {
        // Send via HTTP or socket
        if (socketRef.current?.connected) {
          socketRef.current.emit("message", messageData);
        }
      } catch (error) {
        console.error("Message send error:", error);
      }
    }
  };

  const renderMessageItem = ({ item }) => {
    const isSentByMe = item.senderId === data.data._id;

    return (
      <View
        style={[
          styles.message,
          isSentByMe ? styles.myMessage : styles.friendMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    );
  };

  const joinChannel = async () => {
    // Get token and appId from backend
    const res = await fetch(`http://10.10.10.42:5000/video/token?channel=${channel}&uid=${uid}`);
    const data = await res.json();
    setAppId(data.appID);
    setToken(data.token);

    // Create Agora engine
    const rtcEngine = await RtcEngine.create(data.appID);
    await rtcEngine.setChannelProfile(ChannelProfile.Communication);
    await rtcEngine.setClientRole(ClientRole.Broadcaster);

    rtcEngine.addListener('UserJoined', (uid, elapsed) => {
      setRemoteUids(prevUids => [...prevUids, uid]);
    });
    rtcEngine.addListener('UserOffline', (uid, reason) => {
      setRemoteUids(prevUids => prevUids.filter(id => id !== uid));
    });

    await rtcEngine.enableVideo();
    await rtcEngine.startPreview();
    await rtcEngine.joinChannel(data.token, channel, null, uid);
    setEngine(rtcEngine);
    setJoined(true);
    setIsMuted(false);
    setIsFrontCamera(true);
  };

  const leaveChannel = async () => {
    if (engine) {
      await engine.leaveChannel();
      await engine.destroy();
      setJoined(false);
      setEngine(null);
      setRemoteUids([]);
    }
  };

  const toggleMute = async () => {
    if (engine) {
      if (isMuted) {
        await engine.enableLocalAudio(true);
        setIsMuted(false);
      } else {
        await engine.enableLocalAudio(false);
        setIsMuted(true);
      }
    }
  };

  const switchCamera = async () => {
    if (engine) {
      await engine.switchCamera();
      setIsFrontCamera(prev => !prev);
    }
  };

  // --- CALLER: SEND CALL REQUEST ---
  const handleCallRequest = (callType) => {
    setCalling(true);
    const roomId = `${data.data._id}_${friend._id}`;
    socketRef.current.emit('call:request', {
      from: data.data._id,
      to: friend._id,
      callType,
      roomId,
    });
  };

  // --- RECIPIENT: ACCEPT/REJECT ---
  const acceptCall = () => {
    if (callRequest) {
      socketRef.current.emit('call:accepted', {
        to: callRequest.from,
        from: data.data._id,
        roomId: callRequest.roomId,
        callType: callRequest.callType,
      });
      navigation.navigate('CallScreen', {
        isCaller: false,
        roomId: callRequest.roomId,
        selfId: data.data._id,
        remoteId: callRequest.from,
        callType: callRequest.callType,
      });
      setCallRequest(null);
    }
  };
  const rejectCall = () => {
    if (callRequest) {
      socketRef.current.emit('call:rejected', {
        to: callRequest.from,
        from: data.data._id,
      });
      setCallRequest(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with friend's name and call icons */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Image
            source={{ uri: friend.image.secure_url }}
            style={styles.profilePic}
          />
          <Text style={styles.friendName}>{friend.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Audio Call Icon */}
          <TouchableOpacity
            onPress={() => handleCallRequest('audio')}
            style={{ marginHorizontal: 8 }}
          >
            <Ionicons name="call" size={28} color="#007bff" />
          </TouchableOpacity>
          {/* Video Call Icon */}
          <TouchableOpacity
            onPress={() => handleCallRequest('video')}
          >
            <Ionicons name="videocam" size={28} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) =>
          item._id ? item._id.toString() : index.toString()
        }
        style={styles.messageContainer}
        onContentSizeChange={() => {
          flatListRef?.current?.scrollToEnd({ animated: false });
        }}
        onScrollToIndexFailed={() => {
          flatListRef?.current?.scrollToEnd({ animated: false });
        }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>Reconnecting...</Text>
        </View>
      )}
      {/* --- CALLING MODAL FOR CALLER --- */}
      <Modal visible={calling} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 32, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginBottom: 12 }}>Calling...</Text>
            <Text style={{ fontSize: 16, color: '#555' }}>{friend?.name}</Text>
            <Text style={{ marginTop: 16, color: '#007bff' }}>Waiting for response...</Text>
            <TouchableOpacity style={{ marginTop: 18 }} onPress={() => setCalling(false)}>
              <Text style={{ color: '#e74c3c' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* --- CALL REJECTED MODAL --- */}
      <Modal visible={callRejected} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 32, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#e74c3c' }}>Call Declined</Text>
          </View>
        </View>
      </Modal>
      {/* --- INCOMING CALL MODAL FOR RECIPIENT --- */}
      <Modal visible={!!callRequest} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 32, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginBottom: 12 }}>Incoming {callRequest?.callType === 'audio' ? 'Audio' : 'Video'} Call</Text>
            <Text style={{ fontSize: 16, color: '#555' }}>From: {callRequest?.from}</Text>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={{ marginRight: 24 }} onPress={acceptCall}>
                <Text style={{ color: '#27ae60', fontSize: 16 }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={rejectCall}>
                <Text style={{ color: '#e74c3c', fontSize: 16 }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 20,
    backgroundColor: "#f7f7f7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendName: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  messageContainer: {
    flex: 1,
    marginBottom: 10,
  },
  message: {
    maxWidth: "70%",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
  },
  friendMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  sendButton: {
    padding: 10,
  },
  connectionStatus: {
    backgroundColor: "#ffcccb",
    padding: 5,
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 5,
  },
  connectionText: {
    color: "#d8000c",
    fontSize: 12,
  },
  button: {
    backgroundColor: '#ddd',
    padding: 10,
    marginVertical: 5,
    borderRadius: 4,
  },
  featureButton: {
    backgroundColor: '#bbb',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 4,
  },
});

export default Chatting;