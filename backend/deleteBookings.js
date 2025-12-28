const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/kinder_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const deleteBookings = async () => {
  try {
    // Booking IDs to delete (last 6 chars shown in images)
    const bookingIdsToDelete = [
      // Image 1 - 12/14/2025 bookings
      '66874b',
      '660611',
      
      // Image 2 - Page 3 of 4 (12/12/2025 bookings)
      '4e45aa',
      'c38d4e',
      'c38d23',
      'c38d14',
      '7811ce',
      '7811ab',
      '7811bc',
      '781169',
      '781154',
      'c35395',
      
      // Image 3 - Page 4 of 4 (12/12, 12/13, 12/15/2025 bookings)
      '9da582',
      '9da4f3',
      'ba69a6',
      'ba6980',
      'ba696d',
      'ba695a',
      '5252c5',
      '86887c'
    ];

    // Find all bookings that end with these IDs
    const allBookings = await Booking.find({});
    const bookingsToDelete = allBookings.filter(booking => {
      const bookingIdSuffix = booking._id.toString().slice(-6);
      return bookingIdsToDelete.includes(bookingIdSuffix);
    });

    console.log(`Found ${bookingsToDelete.length} bookings to delete:`);
    bookingsToDelete.forEach(b => {
      console.log(`  - ${b._id} (${new Date(b.date).toLocaleDateString()}, ${b.status}, ৳${b.totalAmount})`);
    });

    // Delete them
    const result = await Booking.deleteMany({
      _id: { $in: bookingsToDelete.map(b => b._id) }
    });

    console.log(`\n✅ Deleted ${result.deletedCount} bookings`);

    // Get remaining bookings count and total revenue
    const remaining = await Booking.find({});
    const totalRevenue = remaining.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    console.log(`\n📊 Database Stats:`);
    console.log(`   Total bookings remaining: ${remaining.length}`);
    console.log(`   Total revenue: ৳${totalRevenue}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting bookings:', error);
    process.exit(1);
  }
};

deleteBookings();


