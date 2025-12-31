const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

// Submit a report (protected)
router.post('/', protect, reportController.submitReport);

// Get user's own reports
router.get('/my-reports', protect, reportController.getUserReports);

// Check payment status before allowing report submission
router.get('/check-payment/:bookingId', protect, reportController.checkPaymentStatusForBooking);

// Get reports for specific booking
router.get('/booking/:bookingId', protect, reportController.getBookingReports);

// Admin routes
router.get('/admin/all', protect, adminOnly, reportController.getReportsWithBookings);
router.get('/admin/stats', protect, adminOnly, reportController.getReportStats);
router.get('/admin/:reportId', protect, adminOnly, reportController.getReportDetails);
router.put('/admin/:reportId', protect, adminOnly, reportController.updateReport);

module.exports = router;
