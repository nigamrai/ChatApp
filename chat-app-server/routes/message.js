const express = require('express');
const Message = require('../models/Message');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

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

//Delete Message
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMessage = await Message.findByIdAndDelete(id);
        res.status(200).json(deletedMessage);
    } catch (error) {
        res.status(500).json(error);
    }
});

//Edit Message
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    try {
        const updatedMessage = await Message.findByIdAndUpdate(id, { message }, { new: true });
        res.status(200).json(updatedMessage);
    } catch (error) {
        res.status(500).json(error);
    }
});

//image upload
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64
        const base64String = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            folder: 'chat_images'
        });

        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

module.exports = router;