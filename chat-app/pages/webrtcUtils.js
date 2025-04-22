// Twilio Video-based call utilities
import Video from 'twilio-video';
import axios from 'axios';
import axiosInstance from '../helpers/axiosInstance';
import {BACKEND_URL} from './config';
const BACKEND_URL = BACKEND_URL ;

export const getTwilioToken = async (identity, room) => {
  const res = await axiosInstance.post(`${BACKEND_URL}/video/token`, { identity, room });
  return res.data.token;
};

export const joinTwilioRoom = async ({ token, roomName, onParticipantConnected, onParticipantDisconnected }) => {
  const room = await Video.connect(token, {
    name: roomName,
    audio: true,
    video: { facingMode: 'user' },
  });
  room.participants.forEach(onParticipantConnected);
  room.on('participantConnected', onParticipantConnected);
  room.on('participantDisconnected', onParticipantDisconnected);
  return room;
};

export const leaveTwilioRoom = (room) => {
  if (room) {
    room.disconnect();
  }
};
