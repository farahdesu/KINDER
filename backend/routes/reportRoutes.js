const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

// Submit a report (protected)
router.post('/', protect, reportController.submitReport);

// Get user's own reports
router.get('/my-reports', protect, reportController.getUserReports);

// Admin routes
router.get('/admin/all', protect, adminOnly, reportController.getReports);
router.get('/admin/stats', protect, adminOnly, reportController.getReportStats);
router.get('/admin/:reportId', protect, adminOnly, reportController.getReportDetails);
router.put('/admin/:reportId', protect, adminOnly, reportController.updateReport);

module.exports = router;
