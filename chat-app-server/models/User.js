const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    public_id:{
      type:String
    },
    secure_url:{
      type:String
    } // Store the filename instead of the actual image
  },
});

module.exports = mongoose.model('User', userSchema);
