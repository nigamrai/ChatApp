import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import * as ImagePicker from 'expo-image-picker'; // Using Expo's ImagePicker
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axiosInstance from '../helpers/axiosInstance.js';

export default function SignUp({ navigation }) {
  console.log("SignUp component is rendering");

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [image, setImage] = useState(null);

  // Handle Image Selection
  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // Handle Sign-Up
  const handleSignUp = async () => {
    console.log("SignUp values:", { name, email, password, confirmPassword });
    
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !image) {

      Alert.alert('Error', 'Please fill in all fields and select an image.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('email', email.trim());
    formData.append('password', password);
    formData.append('image', {
      uri: image.uri,
      type: 'image/jpeg', // or the appropriate type
      name: image.uri.split('/').pop(),
    });

    try {
      const response = await axiosInstance.post('/auth/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Sign Up Successful', `Welcome, ${name.trim()}!`);
      navigation.goBack();
    } catch (error) {
      console.error('Sign Up Failed:', error);
      Alert.alert('Sign Up Failed', error.response?.data?.error || error.message);

    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign Up</Text>

      {/* Profile Image Picker */}
      <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={80} color="#666" />
        )}
      </TouchableOpacity>

      {/* Input Fields */}
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Navigation to Login */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.signupLink}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupLink: {
    marginTop: 15,
    color: '#1E90FF',
    textDecorationLine: 'underline',
  },
});
