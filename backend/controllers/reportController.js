const Report = require('../models/Report');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Submit a report
exports.submitReport = async (req, res) => {
  try {
    const { reportedUserId, bookingId, category, description } = req.body;
    const reporterId = req.user._id;

    // Validate input
    if (!reportedUserId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reportedUserId, category, and description'
      });
    }

    const validCategories = ['harassment', 'misconduct', 'safety_concern', 'fraud', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    if (description.length < 20 || description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be between 20 and 1000 characters'
      });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    // Check if booking exists (if provided)
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
    }

    // Check for duplicate reports (same reporter, reported user, within 24 hours)
    const recentReport = await Report.findOne({
      reporterId,
      reportedUserId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this user in the last 24 hours'
      });
    }

    // Determine severity based on category
    let severity = 'medium';
    if (category === 'safety_concern' || category === 'harassment') {
      severity = 'high';
    } else if (category === 'fraud') {
      severity = 'critical';
    }

    // Create report
    const report = await Report.create({
      reporterId,
      reportedUserId,
      bookingId: bookingId || null,
      category,
      description,
      severity,
      status: 'open'
    });

    console.log(`📋 Report submitted: ${category} against ${reportedUser.name}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: report
    });

  } catch (error) {
    console.error('🔥 SUBMIT REPORT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
};

// Get reports for admin
exports.getReports = async (req, res) => {
  try {
    const { status = 'all', category = 'all', severity = 'all', limit = 10, page = 1 } = req.query;

    let query = {};
    
    if (status !== 'all') query.status = status;
    if (category !== 'all') query.category = category;
    if (severity !== 'all') query.severity = severity;

    const reports = await Report.find(query)
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email role')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET REPORTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// Get report details
exports.getReportDetails = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('reporterId', 'name email phone')
      .populate('reportedUserId', 'name email role phone')
      .populate('bookingId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('🔥 GET REPORT DETAILS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report details',
      error: error.message
    });
  }
};

// Update report status and resolution
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolution, adminNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (status) {
      const validStatuses = ['open', 'under_review', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      report.status = status;
    }

    if (resolution) {
      const validResolutions = ['warning', 'suspension', 'ban', 'no_action'];
      if (!validResolutions.includes(resolution)) {
        return res.status(400).json({
          success: false,
          message: `Resolution must be one of: ${validResolutions.join(', ')}`
        });
      }
      report.resolution = resolution;
      report.resolvedAt = new Date();

      // Take action based on resolution
      if (resolution === 'warning') {
        // Create warning notification
        await Notification.create({
          userId: report.reportedUserId,
          type: 'warning',
          title: 'Account Warning',
          message: `Your account has received a warning for: ${report.category}. Please review our community guidelines.`,
          relatedId: report._id,
          relatedModel: 'Report'
        });
        console.log(`⚠️ Warning issued to user ${report.reportedUserId}`);
      } else if (resolution === 'suspension') {
        // Create suspension notification
        await Notification.create({
          userId: report.reportedUserId,
          type: 'suspension',
          title: 'Account Suspended',
          message: `Your account has been temporarily suspended due to: ${report.category}. Please contact support.`,
          relatedId: report._id,
          relatedModel: 'Report'
        });
        console.log(`🚫 Account suspended for user ${report.reportedUserId}`);
      } else if (resolution === 'ban') {
        // Create ban notification
        await Notification.create({
          userId: report.reportedUserId,
          type: 'suspension',
          title: 'Account Banned',
          message: `Your account has been permanently banned due to: ${report.category}. This decision is final.`,
          relatedId: report._id,
          relatedModel: 'Report'
        });
        console.log(`🔒 Account banned for user ${report.reportedUserId}`);
      }
    }

    if (adminNotes) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    console.log(`✅ Report ${reportId} updated: ${status} - ${resolution}`);

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });

  } catch (error) {
    console.error('🔥 UPDATE REPORT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
};

// Get user's reports (for user to see their own reports)
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, page = 1 } = req.query;

    const reports = await Report.find({ reporterId: userId })
      .populate('reportedUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ reporterId: userId });

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET USER REPORTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your reports',
      error: error.message
    });
  }
};

// Get report statistics for admin dashboard
exports.getReportStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const openReports = await Report.countDocuments({ status: 'open' });
    const underReview = await Report.countDocuments({ status: 'under_review' });
    const resolved = await Report.countDocuments({ status: 'resolved' });

    const byCategory = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const bySeverity = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        openReports,
        underReview,
        resolved,
        byCategory,
        bySeverity
      }
    });

  } catch (error) {
    console.error('🔥 GET REPORT STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report statistics',
      error: error.message
    });
  }
};
