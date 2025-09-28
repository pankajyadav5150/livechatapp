import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessagesRoute.js";
import setupSocket from "./socket.js";
import channelRoutes from "./routes/ChannelRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8747; // Render will provide the PORT
const databaseURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app'; // Updated for Render

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS to all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Serve static files
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json());

// Root route to show server status
app.get('/', (req, res) => {
  const status = {
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      messages: '/api/messages',
      channels: '/api/channel',
      contacts: '/api/contacts'
    },
    documentation: 'Check the console for more details'
  };
  
  // Send a nice HTML response
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chat App Server</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          .status {
            background: #f4f4f4;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .success {
            color: #2ecc71;
            font-weight: bold;
          }
          .endpoint {
            margin: 10px 0;
            padding: 10px;
            background: #e8f4fc;
            border-left: 4px solid #3498db;
          }
        </style>
      </head>
      <body>
        <h1>🚀 Chat App Server</h1>
        <div class="status">
          <p>Status: <span class="success">✅ Server is running</span></p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
        
        <h2>📡 Available Endpoints</h2>
        <div class="endpoint">
          <strong>Authentication:</strong> /api/auth
        </div>
        <div class="endpoint">
          <strong>Messages:</strong> /api/messages
        </div>
        <div class="endpoint">
          <strong>Channels:</strong> /api/channel
        </div>
        <div class="endpoint">
          <strong>Contacts:</strong> /api/contacts
        </div>
        
        <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
          ℹ️ Check the server console for more detailed information
        </p>
      </body>
    </html>
  `);
});


app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);

// Start the server only after DB connection is established
const startServer = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(databaseURL);
    console.log('✅ Database connection successful');
    
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`\n🚀 Server is running on port ${port}`);
      console.log(`🌐 Access the server at: http://localhost:${port}`);
      console.log(`\n📡 API Endpoints:`);
      console.log(`- Auth:       /api/auth`);
      console.log(`- Messages:   /api/messages`);
      console.log(`- Channels:   /api/channel`);
      console.log(`\n🛑 Press Ctrl+C to stop the server\n`);
    });
    
    // Setup Socket.IO
    setupSocket(server);
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      }
      console.error('Server error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1); // Exit with failure
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Start the application
startServer();
