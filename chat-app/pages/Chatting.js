// File intentionally left blank after removing agora/twilio/webrtc code.
import { BACKEND_URL } from '@env';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// ...existing code...
import { useSelector } from "react-redux";
import io from "socket.io-client";
import axiosInstance from "../helpers/axiosInstance.js";
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

  // ...existing code...
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);

  useEffect(() => {
    console.log("URL For socket connection",BACKEND_URL)
    // Initialize socket connection
    socketRef.current = io("http://10.10.10.96:5000", {
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

    // ...existing code...

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off("message", handleIncomingMessage);
        socketRef.current.disconnect();
      }
    };
  }, [friend, data.data._id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      try {
        // Upload image to your server
        const uploadResponse = await axiosInstance.post('/messages/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Send message with image URL
        const messageData = {
          senderId: data.data._id,
          recipientId: friend._id,
          message: uploadResponse.data.url,
          messageType: "image",
        };

        // Optimistic update
        setMessages((prev) => [...prev, messageData]);

        // Send via socket
        if (socketRef.current?.connected) {
          socketRef.current.emit("message", messageData);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert('Failed to send image');
      }
    }
  };

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

  const deleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setShowMessageOptions(false);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const updateMessage = async (messageId) => {
    if (!editedText.trim()) return;
    
    try {
      await axiosInstance.put(`/messages/${messageId}`, {
        message: editedText
      });
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, message: editedText } : msg
      ));
      
      setEditingMessage(null);
      setEditedText("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleMessageLongPress = (message) => {
    if (message.senderId === data.data._id) {
      setSelectedMessage(message);
      setShowMessageOptions(true);
    }
  };

  const startEditing = (message) => {
    setEditingMessage(message);
    setEditedText(message.message);
    setShowMessageOptions(false);
  };

  const renderMessageItem = ({ item }) => {
    const isSentByMe = item.senderId === data.data._id;

    if (editingMessage && editingMessage._id === item._id) {
      return (
        <View style={[styles.message, isSentByMe ? styles.myMessage : styles.friendMessage]}>
          <TextInput
            style={[styles.messageText, { backgroundColor: '#fff', color: '#000', padding: 5 }]}
            value={editedText}
            onChangeText={setEditedText}
            autoFocus
          />
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={() => updateMessage(item._id)}>
              <Ionicons name="checkmark" size={24} color="#27ae60" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setEditingMessage(null);
              setEditedText("");
            }}>
              <Ionicons name="close" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.message, isSentByMe ? styles.myMessage : styles.friendMessage]}>
          {item.messageType === "image" ? (
            <Image
              source={{ uri: item.message }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.messageText}>{item.message}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ...existing code...

  return (
    <View style={styles.container}>
      {/* Header with friend's name */}
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
        <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
          <Ionicons name="image" size={24} color="#007bff" />
        </TouchableOpacity>
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
      {/* Message Options Modal */}
      <Modal visible={showMessageOptions} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMessageOptions(false)}
        >
          <View style={styles.messageOptionsContainer}>
            <TouchableOpacity 
              style={styles.messageOption}
              onPress={() => startEditing(selectedMessage)}
            >
              <Ionicons name="create-outline" size={24} color="#007bff" />
              <Text style={styles.messageOptionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageOption}
              onPress={() => deleteMessage(selectedMessage._id)}
            >
              <Ionicons name="trash-outline" size={24} color="#e74c3c" />
              <Text style={styles.messageOptionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '80%',
    maxWidth: 300,
  },
  messageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  messageOptionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  messageImage: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
    borderRadius: 10,
  },
  attachButton: {
    padding: 10,
  },
});

export default Chatting;