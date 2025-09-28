import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Check multiple possible cookie names
    const token = req.cookies.jwt || req.cookies['access-token'] || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token found in cookies or headers');
      return res.status(401).json({ error: "You are not authenticated!" });
    }

    jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
      if (err) {
        console.log('Token verification failed:', err.message);
        return res.status(403).json({ error: "Token is not valid!" });
      }
      
      req.userId = payload?.userId || payload?.id;
      console.log('User authenticated with ID:', req.userId);
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};
