// backend/seedAdmin.js - Create default admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@kinder.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@kinder.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@kinder.com',
      password: 'admin123', // Will be hashed by the pre-save hook
      role: 'admin',
      phone: '+880-1234567890'
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('=================================');
    console.log('👨‍💼 ADMIN CREDENTIALS:');
    console.log('📧 Email: admin@kinder.com');
    console.log('🔑 Password: admin123');
    console.log('=================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();

