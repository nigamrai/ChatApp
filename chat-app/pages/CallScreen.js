import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import RtcEngine, { RtcLocalView, RtcRemoteView, VideoRenderMode } from 'react-native-agora';
import { PermissionsAndroid } from 'react-native';

const AGORA_APP_ID = '2b15b3bb08ee4fc4813bfa201099fbd0'; // TODO: Replace with your actual Agora App ID

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
      if (
        granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Permission denied');
      }
      return (
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  }
  return true;
};

const CallScreen = ({ route, navigation }) => {
  const params = route?.params || {};
  const { roomId, callType } = params;
  const [engine, setEngine] = useState(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [token, setToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(Platform.OS === 'ios');

  useEffect(() => {
    requestPermissions().then(setPermissionGranted);
  }, []);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`http://10.10.10.113:5000/video/token?channel=${roomId}`);
        const data = await res.json();
        setToken(data.token);
        console.log('Fetched Agora token:', data.token);
      } catch (err) {
        console.error('Failed to fetch Agora token:', err);
        Alert.alert('Token Error', 'Failed to fetch Agora token.');
      }
    };
    fetchToken();
  }, [roomId]);

  useEffect(() => {
    if (!token || !permissionGranted) return;
    let rtcEngine;
    const init = async () => {
      console.log('=== Agora Engine Init Start ===');
      console.log('Token:', token);
      console.log('RoomId:', roomId);
      console.log('Permissions granted:', permissionGranted);
      try {
        rtcEngine = await RtcEngine.create(AGORA_APP_ID);
        setEngine(rtcEngine);
        console.log('Rtc engine created', rtcEngine);
      } catch (err) {
        console.error('RtcEngine.create failed:', err);
        Alert.alert('Agora Init Error', 'RtcEngine.create failed: ' + err?.message || err);
        return;
      }

      rtcEngine.addListener('Warning', (warn) => { console.warn('Agora warning:', warn); });
      rtcEngine.addListener('Error', (err) => { console.error('Agora error:', err); });
      rtcEngine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
        setJoined(true);
        console.log('JoinChannelSuccess', channel, uid, elapsed);
      });
      rtcEngine.addListener('UserJoined', (uid, elapsed) => {
        setRemoteUid(uid);
        console.log('Remote user joined:', uid, 'Elapsed:', elapsed);
      });
      rtcEngine.addListener('UserOffline', (uid, reason) => {
        setRemoteUid(null);
        console.log('Remote user offline:', uid, 'Reason:', reason);
      });
      rtcEngine.addListener('RemoteVideoStateChanged', (...args) => {
        console.log('RemoteVideoStateChanged', ...args);
      });
      rtcEngine.addListener('RemoteAudioStateChanged', (...args) => {
        console.log('RemoteAudioStateChanged', ...args);
      });
      rtcEngine.addListener('ConnectionStateChanged', (state, reason) => {
        console.log('ConnectionStateChanged', state, reason);
      });
      rtcEngine.addListener('ChannelMediaRelayStateChanged', (...args) => {
        console.log('ChannelMediaRelayStateChanged', ...args);
      });
      rtcEngine.addListener('NetworkQuality', (...args) => {
        console.log('NetworkQuality', ...args);
      });
      rtcEngine.addListener('RtcStats', (...args) => {
        console.log('RtcStats', ...args);
      });

      if (callType === 'audio') {
        await rtcEngine.enableAudio();
        console.log('Audio enabled');
      } else {
        await rtcEngine.enableVideo();
        await rtcEngine.startPreview();
        console.log('Video enabled and preview started');
      }
      try {
        console.log('joinChannel called with:', token, roomId);
        await rtcEngine.joinChannel(token, roomId, null, 0);
        console.log('joinChannel called');
      } catch (err) {
        console.error('joinChannel error:', err);
      }
      console.log('=== Agora Engine Init End ===');
    };
    init();
    return () => {
      if (rtcEngine) {
        rtcEngine.leaveChannel();
        rtcEngine.destroy();
        console.log('Rtc engine destroyed');
      }
    };
  }, [token, roomId, permissionGranted, callType]);

  return (
    <View style={{ flex: 1, backgroundColor: '#222' }}>
      <Text style={styles.title}>{callType === 'audio' ? 'Audio Call' : 'Video Call'}</Text>
      <View style={styles.videoContainer}>
        {!permissionGranted && (
          <Text style={{ color: 'red', fontSize: 16 }}>Camera/Microphone permission required.</Text>
        )}
        {permissionGranted && joined && callType !== 'audio' && (
          <RtcLocalView.SurfaceView
            style={styles.localVideo}
            channelId={roomId}
            renderMode={VideoRenderMode.Hidden}
            zOrderMediaOverlay={true}
          />
        )}
        {permissionGranted && remoteUid !== null && callType !== 'audio' && (
          <RtcRemoteView.SurfaceView
            style={styles.remoteVideo}
            uid={remoteUid}
            channelId={roomId}
            renderMode={VideoRenderMode.Hidden}
          />
        )}
        {permissionGranted && !joined && (
          <Text style={{ color: '#fff', fontSize: 16 }}>Joining channel...</Text>
        )}
        {permissionGranted && callType === 'audio' && joined && (
          <Text style={{ color: '#fff', fontSize: 18 }}>Audio Call in Progress...</Text>
        )}
      </View>
      <TouchableOpacity style={styles.endButton} onPress={() => navigation.goBack()}>
        <Text style={styles.endButtonText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, margin: 16 },
  videoContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  localVideo: { width: 120, height: 180, position: 'absolute', top: 40, right: 10, zIndex: 2, borderRadius: 8 },
  remoteVideo: { width: 320, height: 400, borderRadius: 8 },
  endButton: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 8, marginBottom: 32, alignSelf: 'center' },
  endButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CallScreen;
