const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const OTP = require('../models/Otp');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Material = require('../models/Material');
const path = require('path');
const axios = require('axios');
const mime = require('mime-types');
const User = require('../models/User');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage (support all file types)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'medvault_faculty',
      resource_type: 'auto', // Allow all file types (image, video, raw)
      public_id: `${Date.now()}_${file.originalname}`, // Use original filename with timestamp
    };
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.facultyId = decoded.facultyId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Generate JWT
const generateToken = (facultyId) => {
  return jwt.sign({ facultyId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Signup route with optional file upload
router.post('/signup', upload.single('file'), async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { firstName, lastName, employeeId, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields (firstName, lastName, employeeId, email, password, confirmPassword) are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Cross-collection email uniqueness check
    const userWithEmail = await User.findOne({ email });
    if (userWithEmail) {
      return res.status(400).json({ message: 'Email already in use by a student' });
    }
    const existingFaculty = await Faculty.findOne({ $or: [{ email }, { employeeId }] });
    if (existingFaculty) {
      return res.status(400).json({ message: 'Email or employee ID already in use' });
    }

    const faculty = new Faculty({ firstName, lastName, employeeId, email, password });
    if (req.file) {
      faculty.cloudinaryLink = req.file.path; // Store Cloudinary URL
      faculty.originalFileName = req.file.originalname; // Store original filename
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new OTP({ userId: faculty._id, otp: otpCode });

    await otp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for StudyHub Faculty Registration',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'OTP sent to email. Verify to complete registration.',
      facultyId: faculty._id,
      cloudinaryLink: faculty.cloudinaryLink,
      originalFileName: faculty.originalFileName,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during signup: ' + error.message });
  }
});

// Verify OTP and save faculty with JWT
router.post('/verify-otp', upload.single('file'), async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { facultyId, otp, firstName, lastName, employeeId, email, password } = req.body;

  if (!facultyId || !otp || !firstName || !lastName || !employeeId || !email || !password) {
    return res.status(400).json({ message: 'All fields (facultyId, otp, firstName, lastName, employeeId, email, password) are required' });
  }

  try {
    // Cross-collection email uniqueness check
    const userWithEmail = await User.findOne({ email });
    if (userWithEmail) {
      return res.status(400).json({ message: 'Email already in use by a student' });
    }
    const otpRecord = await OTP.findOne({ userId: facultyId, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const faculty = new Faculty({
      _id: facultyId,
      firstName,
      lastName,
      employeeId,
      email,
      password,
      cloudinaryLink: req.file ? req.file.path : null,
      originalFileName: req.file ? req.file.originalname : null,
    });

    await faculty.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(faculty._id);

    res.status(201).json({
      message: 'Faculty registered successfully',
      token,
      faculty: {
        id: faculty._id,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        employeeId: faculty.employeeId,
        email: faculty.email,
        cloudinaryLink: faculty.cloudinaryLink,
        originalFileName: faculty.originalFileName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP: ' + error.message });
  }
});

// Send OTP (for resending OTP)
router.post('/send-otp', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { facultyId, email } = req.body;

  if (!facultyId || !email) {
    return res.status(400).json({ message: 'facultyId and email are required' });
  }

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new OTP({ userId: facultyId, otp: otpCode });

    await otp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for MedVault Faculty',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP: ' + error.message });
  }
});

// Login route with JWT
router.post('/login', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const faculty = await Faculty.findOne({ email }).select('+password');
    if (!faculty) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await faculty.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(faculty._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      faculty: {
        id: faculty._id,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        employeeId: faculty.employeeId,
        email: faculty.email,
        cloudinaryLink: faculty.cloudinaryLink,
        originalFileName: faculty.originalFileName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login: ' + error.message });
  }
});

// Profile route (protected)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.facultyId).select('-password');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.status(200).json({ faculty });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile: ' + error.message });
  }
});

// Update profile with optional file upload (protected)
router.put('/update-profile', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { firstName, lastName, employeeId, email, password } = req.body;
    const updateData = { firstName, lastName, employeeId, email };

    if (password) {
      updateData.password = password;
    }
    if (req.file) {
      updateData.cloudinaryLink = req.file.path;
      updateData.originalFileName = req.file.originalname;
    }

    const faculty = await Faculty.findByIdAndUpdate(req.facultyId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      faculty,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile: ' + error.message });
  }
});

// Delete faculty (protected)
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    // Find the faculty to delete
    const faculty = await Faculty.findById(req.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Delete associated materials from Material collection
    const materials = await Material.find({ employeeId: faculty.employeeId });
    for (const material of materials) {
      if (material.fileUrl) {
        // Extract public_id from Cloudinary URL
        const publicId = material.fileUrl.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(`medvault_faculty/${publicId}`, {
            resource_type: material.fileUrl.includes('image') ? 'image' : 'raw',
          });
        } catch (cloudinaryError) {
          console.error(`Failed to delete Cloudinary resource ${publicId}:`, cloudinaryError.message);
        }
      }
    }
    await Material.deleteMany({ employeeId: faculty.employeeId });

    // Delete faculty's profile file from Cloudinary, if it exists
    if (faculty.cloudinaryLink) {
      const publicId = faculty.cloudinaryLink.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`medvault_faculty/${publicId}`, {
          resource_type: faculty.cloudinaryLink.includes('image') ? 'image' : 'raw',
        });
      } catch (cloudinaryError) {
        console.error(`Failed to delete Cloudinary resource ${publicId}:`, cloudinaryError.message);
      }
    }

    // Delete any associated OTPs
    await OTP.deleteMany({ userId: faculty._id });

    // Delete the faculty record
    await Faculty.findByIdAndDelete(req.facultyId);

    res.status(200).json({ message: 'Faculty and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error.message);
    res.status(500).json({ message: 'Error deleting faculty: ' + error.message });
  }
});

// Upload file independently (protected)
router.post('/upload-file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const faculty = await Faculty.findByIdAndUpdate(
      req.facultyId,
      { cloudinaryLink: req.file.path, originalFileName: req.file.originalname },
      { new: true, runValidators: true }
    ).select('-password');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      faculty,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file: ' + error.message });
  }
});

// Upload and save a new material
router.post('/materials', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, subject, description, courseCode, tags, employeeId } = req.body;
    if (!title || !subject || !employeeId || !req.file) {
      return res.status(400).json({ message: 'Title, subject, employeeId, and file are required.' });
    }
    const material = new Material({
      title,
      subject,
      description,
      courseCode,
      tags,
      employeeId,
      fileUrl: req.file.path,
      originalFileName: req.file.originalname,
    });
    await material.save();
    res.status(201).json({ message: 'Material uploaded successfully', material });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading material: ' + error.message });
  }
});

// Get all materials for a faculty by employeeId
router.get('/materials', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required' });
    }
    const materials = await Material.find({ employeeId }).sort({ uploadedAt: -1 });
    res.status(200).json({ materials });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching materials: ' + error.message });
  }
});

// Get all materials
router.get('/all-materials', async (req, res) => {
  try {
    const materials = await Material.find({}).sort({ uploadedAt: -1 });
    res.status(200).json({ materials });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all materials: ' + error.message });
  }
});

// Download file with correct filename and content type
router.get('/download/:materialId', authMiddleware, async (req, res) => {
  console.log('materialId:', req.params.materialId);
  console.log('Authorization Header:', req.header('Authorization'));
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Verify if the user has permission to download
    const faculty = await Faculty.findById(req.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    if (material.employeeId !== faculty.employeeId) {
      return res.status(403).json({ message: 'Unauthorized to download this material' });
    }

    const fileUrl = material.fileUrl;
    if (!fileUrl) {
      return res.status(400).json({ message: 'No file associated with this material' });
    }

    // Determine the filename
    let fileName = material.originalFileName;
    if (!fileName) {
      // Fallback: Use title and extract extension from fileUrl
      const extension = path.extname(fileUrl.split('?')[0]) || '.bin';
      fileName = `${material.title}${extension}`;
    }

    // Get the content type based on the file extension
    const contentType = mime.lookup(fileName) || 'application/octet-stream';

    // Fetch the file from Cloudinary
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
    });

    // Set headers for download
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    // Stream the file to the client
    response.data.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error.message);
    res.status(500).json({ message: 'Error downloading file: ' + error.message });
  }
});

// Delete a specific material (protected)
router.delete('/materials/:materialId', authMiddleware, async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const faculty = await Faculty.findById(req.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Verify if the faculty has permission to delete the material
    if (material.employeeId !== faculty.employeeId) {
      return res.status(403).json({ message: 'Unauthorized to delete this material' });
    }

    // Delete the file from Cloudinary
    if (material.fileUrl) {
      const publicId = material.fileUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`medvault_faculty/${publicId}`, {
          resource_type: material.fileUrl.includes('image') ? 'image' : 'raw',
        });
      } catch (cloudinaryError) {
        console.error(`Failed to delete Cloudinary resource ${publicId}:`, cloudinaryError.message);
      }
    }

    // Delete the material from the database
    await Material.findByIdAndDelete(materialId);

    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error.message);
    res.status(500).json({ message: 'Error deleting material: ' + error.message });
  }
});

module.exports = router;