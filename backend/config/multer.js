const multer = require('multer');

// Use memory storage for simple uploads to cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
