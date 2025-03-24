const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const cloudinary = require('cloudinary');
const app = express();
const PORT = process.env.PORT || 5000;
cloudinary.config({ 
  cloud_name: 'dacafjeag', 
        api_key: '574477448174444',  
  api_secret: 'yngLYLzcTwiXqVirsqR0rBKr-GM'
});
// Middleware
app.use(cors({
  origin: '*', // Allow requests from any origin for testing
}));

app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://khanalbk18:TMWHlbtPsx7caK6Z@cluster0.fnhsl.mongodb.net/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
