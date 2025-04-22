const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// POST endpoint to send a message
router.post('/send', async (req, res) => {
    const { senderId, recipientId, message, messageType } = req.body;
    const newMessage = new Message({
        senderId,
        recipientId,
        message,
        messageType,
    });

    try {
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (error) {
        res.status(500).json(error);
    }
});

// GET endpoint to retrieve messages between two users
router.get('/:senderId/:recipientId', async (req, res) => {
    const { senderId, recipientId } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { senderId, recipientId },
                { senderId: recipientId, recipientId: senderId },
            ],
        }).sort({ timeStamp: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;
