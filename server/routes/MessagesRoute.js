import { Router } from "express";
import { getMessages, uploadFile } from "../controllers/MessagesController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const messagesRoutes = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/files');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only specific file types
  const filetypes = /jpe?g|png|gif|pdf|docx?|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    const error = new Error('Only image, document and PDF files are allowed!');
    error.code = 'LIMIT_FILE_TYPES';
    return cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: fileFilter
}).single('file'); // Make sure this matches the field name in your form data

// Error handling middleware for file uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err) {
    console.error('File upload error:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    
    if (err.code === 'LIMIT_FILE_TYPES') {
      return res.status(400).json({
        success: false,
        error: err.message || 'Invalid file type. Only images, documents and PDFs are allowed.'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Too many files uploaded. Only one file is allowed.'
      });
    }
    
    // For other multer errors
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        success: false,
        error: 'File upload error: ' + err.message 
      });
    }
    
    // For other errors
    return res.status(500).json({ 
      success: false,
      error: 'An error occurred while uploading the file',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next();
};

// Routes
messagesRoutes.post("/get-messages", verifyToken, getMessages);

// Handle file upload
messagesRoutes.post("/upload-file", verifyToken, (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }
    
    // If no file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file was uploaded or the file is empty.'
      });
    }
    
    // Proceed to the uploadFile controller
    uploadFile(req, res, next);
  });
});

export default messagesRoutes;
