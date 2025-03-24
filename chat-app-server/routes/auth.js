const express = require('express');
const User = require('../models/User');
const { isLoggedIn } = require('../middlewares/auth.middleware');
const upload=require('../uploads/upload');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Import JWT
const cloudinary = require('cloudinary').v2;
// Existing login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, 'my_token_secret', { expiresIn: '1h' }); // Replace 'your_jwt_secret' with your actual secret

    res.status(200).json({ token, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup route
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
        console.log(user);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    await user.save();
    user.password = undefined;

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating user' });
    return res.status(500).json({ error: 'Error creating user' });
  }
});

router.get('/users', isLoggedIn, async (req, res) => {
  try {
    const users = await User.find(); // Assuming you have a User model
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Apply isLoggedIn middleware to routes that require authentication
router.post('/friend-request', isLoggedIn, async (req, res) => {
  const { from, to } = req.body;

  try {
    const userTo = await User.findById(to);
    const userFrom = await User.findById(from);
    if (!userTo || !userFrom) {
      return res.status(404).send('User not found');
    }

    // Check if the request already exists
    const existingRequest = userTo.requests.find(request => request.from.toString() === userFrom._id.toString());
    if (existingRequest) {
      return res.status(400).send('Friend request already sent');
    }

    // Add the friend request
    userTo.requests.push({ from: userFrom._id, status: 'pending' });
    await userTo.save();

    res.status(200).send('Friend request sent');
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).send('Server error');
  }
});

router.post("/friend-request/accept", isLoggedIn, async (req, res) => {
  try {
    const { requestId, senderId } = req.body;

    // Retrieve the documents of sender and the recipient
    const sender = await User.findById(senderId);
    const recipient = await User.findById(requestId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the friends list
    sender.friends.push(requestId);
    recipient.friends.push(senderId);

    // Update the request status to accepted
    recipient.requests = recipient.requests.map((request) => {
      if (request.from.toString() === senderId) {
        return { ...request, status: 'accepted' };
      }
      return request;
    });

    await sender.save();
    await recipient.save();

    const pendingRequests = recipient.requests.filter(request => request.status === 'pending');
    res.status(200).json({ message: "Friend Request accepted successfully", pendingRequests });

  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/friend-requests/:userId', isLoggedIn, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate('requests.from');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter the requests to only include those with a status of 'pending'
    const pendingRequests = user.requests.filter(request => request.status === 'pending');
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;