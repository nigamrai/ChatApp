const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');
const upload = require('../uploads/upload');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');



// Signup Route
router.post('/signup', upload.single('image'), async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all fields and upload an image.' });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password,
      image: {
        public_id: '',
        secure_url: '',
      },
    });
    console.log("File details:" +req.file.path);
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'Chatapp',
          width: 250,
          height: 250,
          gravity: 'faces',
          crop: 'fill',
        });
        console.log("Result:"+result.secure_url);
        if (result) {
          user.image.public_id = result.public_id;
          user.image.secure_url = result.secure_url;
          // Remove file from server
        //  await fs.unlink(req.file.path)
        }
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    await user.save();
    user.password = undefined;

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating user' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;