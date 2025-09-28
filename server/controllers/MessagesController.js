import Message from "../model/MessagesModel.js";

export const getMessages = async (req, res, next) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;
    
    if (!user1 || !user2) {
      return res.status(400).json({
        success: false,
        error: "Both user IDs are required."
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({ 
      success: true,
      messages 
    });
    
  } catch (err) {
    console.error('Error in getMessages:', {
      error: err.message,
      stack: err.stack
    });
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const uploadFile = async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({
        success: false,
        error: 'No file was uploaded or the file is empty.'
      });
    }

    console.log('Processing file upload:', {
      originalname: request.file.originalname,
      mimetype: request.file.mimetype,
      size: request.file.size,
      path: request.file.path
    });

    // Get the relative path for the response
    const relativePath = request.file.path.split('uploads/').pop();
    const fileUrl = `/uploads/files/${relativePath.replace(/\\/g, '/')}`;
    
    console.log('File uploaded successfully:', fileUrl);
    
    return response.status(200).json({ 
      success: true,
      filePath: fileUrl,
      fileName: request.file.originalname,
      fileSize: request.file.size,
      mimeType: request.file.mimetype
    });
    
  } catch (error) {
    console.error('Error in uploadFile controller:', {
      error: error.message,
      stack: error.stack,
      file: request.file ? {
        originalname: request.file.originalname,
        mimetype: request.file.mimetype,
        size: request.file.size,
        path: request.file.path
      } : 'No file in request',
      request: {
        headers: request.headers,
        files: request.files,
        body: request.body
      }
    });
    
    return response.status(500).json({ 
      success: false,
      error: 'Failed to process file upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
