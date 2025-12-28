const mongoose = require('mongoose');
const Booking = require('./models/Booking');

mongoose.connect('mongodb://localhost:27017/kinder_app');

Booking.find({}).then(bookings => {
  console.log(`Total bookings in database: ${bookings.length}`);
  if (bookings.length > 0) {
    console.log('\nFirst 5 bookings:');
    bookings.slice(0, 5).forEach(b => {
      console.log(`  - ${b._id} | ${new Date(b.date).toLocaleDateString()} | ${b.status} | ৳${b.totalAmount}`);
    });
  }
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
