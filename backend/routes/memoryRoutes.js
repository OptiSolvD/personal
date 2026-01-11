const express = require('express');
const router = express.Router();
const Memory = require('../models/Memory');
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinary');

router.get('/', async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(500).json({ 
        error: 'Database not connected. Please ensure MongoDB is running and check your MONGO_URI in .env file.' 
      });
    }
    console.log('MongoDB connection verified');

    // Check if Cloudinary is configured
    const { isConfigured } = require('../config/cloudinary');
    if (!isConfigured()) {
      console.log('Cloudinary not configured');
      return res.status(500).json({ 
        error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      });
    }
    console.log('Cloudinary configuration verified');

    const streamifier = require('streamifier');
    
    console.log('Starting Cloudinary upload...');
    // Use promise-based upload
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const result = await uploadPromise;
    
    console.log('Saving memory to database...');
    const memory = await Memory.create({
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      imageUrl: result.secure_url,
    });
    
    console.log('Memory saved successfully:', memory._id);
    res.json(memory);
  } catch (err) {
    console.error('Upload error:', err);
    console.error('Error stack:', err.stack);
    
    // Format error message for better user experience
    let errorMessage = 'Upload failed';
    
    if (err.message) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.http_code) {
      // Cloudinary error format
      errorMessage = `Cloudinary error: ${err.message || 'Upload failed'}`;
    }
    
    // Ensure we send a proper JSON response
    const errorResponse = { 
      error: errorMessage
    };
    
    // Only include details in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = {
        message: err.message,
        name: err.name,
        ...(err.http_code && { http_code: err.http_code })
      };
    }
    
    res.status(500).json(errorResponse);
  }
});

// Update memory
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const title = req.body.title;
    const description = req.body.description;

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        error: 'Database not connected' 
      });
    }

    const updateData = {};
    if (title !== undefined && title !== null) updateData.title = title;
    if (description !== undefined && description !== null) updateData.description = description;

    // If new image is uploaded, upload to Cloudinary
    if (req.file) {
      const { isConfigured } = require('../config/cloudinary');
      if (!isConfigured()) {
        return res.status(500).json({ 
          error: 'Cloudinary is not configured' 
        });
      }

      const streamifier = require('streamifier');
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      const result = await uploadPromise;
      updateData.imageUrl = result.secure_url;
    }

    const memory = await Memory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(memory);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to update memory' 
    });
  }
});

// Delete memory
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        error: 'Database not connected' 
      });
    }

    const memory = await Memory.findByIdAndDelete(id);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Optionally delete from Cloudinary (if needed)
    // For now, we'll just delete from database

    res.json({ message: 'Memory deleted successfully', id });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to delete memory' 
    });
  }
});

module.exports = router;
