const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  courseCode: {
    type: String,
    trim: true,
    maxlength: 50
  },
  tags: {
    type: String,
    trim: true,
    maxlength: 200
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Material', materialSchema); 