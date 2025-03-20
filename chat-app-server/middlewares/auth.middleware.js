const jwt = require('jsonwebtoken');

 const isLoggedIn = async(req, res, next) => {
    // extracting token from the cookies
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Extract token from Authorization header
    console.log(token)
  
    // If no token, send unauthorized message

    if (!token) {
    return res.status(401).json({ message: 'Unauthorized, please login to continue' });
    }
  
    // Decoding the token using jwt package verify method
    const decoded = await jwt.verify(token, 'my_token_secret');
    console.log(decoded);
    // If no decode send the message unauthorized
    if (!decoded) {
        return res.status(401).json({ message: 'Unauthorized, please login to continue' });
    }
  
    // If all good store the id in req object, here we are modifying the request object and adding a custom field user in it
    req.user = decoded;
  
    // Do not forget to call the next other wise the flow of execution will not be passed further
    next();
  };
module.exports = { isLoggedIn };