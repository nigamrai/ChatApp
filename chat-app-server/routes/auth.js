const express = require('express');
const User = require('../models/User');
const { isLoggedIn } = require('../middlewares/auth.middleware');


const router = express.Router();
const jwt = require('jsonwebtoken'); // Import JWT

// Existing login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user && user.password !== password) {
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
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error creating user' });
  }
});

router.get('/users', isLoggedIn,async (req, res) => {
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
// const acceptFriendRequest = async (req, res) => {
//   const { requestId, senderId } = req.body;

//   try {
//     // Logic to accept the friend request
//     const user = await User.findById(requestId);
//     const sender = await User.findById(senderId);

//     if (!user || !sender) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Add sender to user's friends list
//     user.friends.push(senderId);
//     await user.save();

//     // Optionally, you can remove the request from the pending requests if you have that logic
//     // ...

//     return res.status(200).json({ message: 'Friend request accepted', friends: user.friends });
//   } catch (error) {
//     console.error('Error accepting friend request:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // Other routes...

// router.post('/friend-request/accept', isLoggedIn, acceptFriendRequest);


router.post("/friend-request/accept", isLoggedIn, async (req, res) => {
  try {
    const { requestId, senderId} = req.body;
   console.log(requestId);
    console.log(senderId);
    // Retrieve the documents of sender and the recipient
    const sender = await User.findById(senderId._id);
    const recepient = await User.findById(requestId);
    sender.friends.push(requestId);
    recepient.friends.push(senderId);
    recepient.requests = recepient.requests.filter((request) => {
      if (request.from.toString() === senderId._id.toString()) {
        return { ...request, status: 'accepted' };
      }
      return request;
    });

  
    
    await sender.save();
    await recepient.save();

    const pendingRequests = recepient.requests.filter(request => request.status === 'pending');
    res.status(200).json({ message: "Friend Request accepted successfully", pendingRequests });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/friend-requests/:userId', isLoggedIn, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate({
      path: 'requests.from',
      match: { 'requests.status': 'pending' },
    });

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
