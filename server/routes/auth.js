const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/Otp');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Material = require('../models/Material');
const Faculty = require('../models/Faculty');
const path = require('path');
const axios = require('axios');
const mime = require('mime-types');
require('dotenv').config();
// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Signup route with OTP generation
router.post('/signup', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { firstName, lastName, email, collegeRegNumber, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !collegeRegNumber || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields (firstName, lastName, email, collegeRegNumber, password, confirmPassword) are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Cross-collection email uniqueness check
    const facultyWithEmail = await Faculty.findOne({ email });
    if (facultyWithEmail) {
      return res.status(400).json({ message: 'Email already in use by a faculty member' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { collegeRegNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or college registration number already in use' });
    }

    const user = new User({ firstName, lastName, email, collegeRegNumber, password });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new OTP({ userId: user._id, otp: otpCode });

    await otp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for StudyHub Registration',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'OTP sent to email. Verify to complete registration.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during signup: ' + error.message });
  }
});

// Verify OTP and save user with JWT
router.post('/verify-otp', async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { userId, otp, firstName, lastName, email, collegeRegNumber, password } = req.body;

  if (!userId || !otp || !firstName || !lastName || !email || !collegeRegNumber || !password) {
    return res.status(400).json({ message: 'All fields (userId, otp, firstName, lastName, email, collegeRegNumber, password) are required' });
  }

  try {
    // Cross-collection email uniqueness check
    const facultyWithEmail = await Faculty.findOne({ email });
    if (facultyWithEmail) {
      return res.status(400).json({ message: 'Email already in use by a faculty member' });
    }
    const otpRecord = await OTP.findOne({ userId, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = new User({ _id: userId, firstName, lastName, email, collegeRegNumber, password });
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        collegeRegNumber: user.collegeRegNumber
      }
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

  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ message: 'userId and email are required' });
  }

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new OTP({ userId, otp: otpCode });

    await otp.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for StudyHub',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        collegeRegNumber: user.collegeRegNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login: ' + error.message });
  }
});

// Profile route (protected)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile: ' + error.message });
  }
});

// Get all materials uploaded by a faculty (for students)
router.get('/materials-by-faculty', async (req, res) => {
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

// Public download route for students
router.get('/download/:materialId', async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const fileUrl = material.fileUrl;
    if (!fileUrl) {
      return res.status(400).json({ message: 'No file associated with this material' });
    }

    // Determine the filename
    let fileName = material.originalFileName;
    if (!fileName) {
      const extension = path.extname(fileUrl.split('?')[0]) || '.bin';
      fileName = `${material.title}${extension}`;
    }

    const contentType = mime.lookup(fileName) || 'application/octet-stream';

    // Fetch the file from Cloudinary
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
    });

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error.message);
    res.status(500).json({ message: 'Error downloading file: ' + error.message });
  }
});

module.exports = router;