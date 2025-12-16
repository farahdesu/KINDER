const mongoose = require('mongoose');
const User = require('./User');

const babysitterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  university: {
    type: String,
    required: [true, 'University name is required'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  year: {
    type: Number,
    required: [true, 'Academic year is required'],
    min: 1,
    max: 5
  },
  skills: {
    type: [String],
    default: ['Childcare', 'Homework Help', 'First Aid']
  },
  experience: {
    type: String,
    enum: ['Beginner (0-1 years)', 'Intermediate (1-3 years)', 'Experienced (3+ years)'],
    default: 'Beginner (0-1 years)'
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [100, 'Minimum rate is 100 BDT/hour'],
    max: [1000, 'Maximum rate is 1000 BDT/hour']
  },
  availability: {
    // Days of week with time slots
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }]
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  reviews: [{
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Babysitter', babysitterSchema);