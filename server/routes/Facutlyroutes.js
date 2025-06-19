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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage (support all formats)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medvault_faculty',
    // Allow all formats supported by Cloudinary (images, videos, PDFs, etc.)
    resource_type: 'auto', // Automatically detect file type
  },
});
const upload = multer({ storage });

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
    const existingFaculty = await Faculty.findOne({ $or: [{ email }, { employeeId }] });
    if (existingFaculty) {
      return res.status(400).json({ message: 'Email or employee ID already in use' });
    }

    const faculty = new Faculty({ firstName, lastName, employeeId, email, password });
    if (req.file) {
      faculty.cloudinaryLink = req.file.path; // Store Cloudinary URL
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new OTP({ userId: faculty._id, otp: otpCode });

    await otp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for MedVault Faculty Registration',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: 'OTP sent to email. Verify to complete registration.',
      facultyId: faculty._id,
      cloudinaryLink: faculty.cloudinaryLink,
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
      cloudinaryLink: req.file ? req.file.path : null, // Update Cloudinary URL if file provided
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
      updateData.cloudinaryLink = req.file.path; // Update Cloudinary URL
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
    const faculty = await Faculty.findByIdAndDelete(req.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (error) {
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
      { cloudinaryLink: req.file.path },
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

module.exports = router;