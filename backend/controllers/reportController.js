const Report = require('../models/Report');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Parent = require('../models/Parent');
const Babysitter = require('../models/Babysitter');

// Submit a report
exports.submitReport = async (req, res) => {
  try {
    const { reportedUserId, bookingId, category, description } = req.body;
    const reporterId = req.user._id;

    console.log('📨 Report submission received:');
    console.log('  reportedUserId:', reportedUserId, 'Type:', typeof reportedUserId);
    console.log('  bookingId:', bookingId);
    console.log('  category:', category);
    console.log('  reporterId:', reporterId);

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
    // reportedUserId could be either a Parent ID, Babysitter ID, or User ID
    let reportedUser = await User.findById(reportedUserId);
    
    if (!reportedUser) {
      // Try to find as Parent and get the associated User
      const parent = await Parent.findById(reportedUserId).populate('userId');
      if (parent && parent.userId) {
        reportedUser = parent.userId;
      }
    }
    
    if (!reportedUser) {
      // Try to find as Babysitter and get the associated User
      const babysitter = await Babysitter.findById(reportedUserId).populate('userId');
      if (babysitter && babysitter.userId) {
        reportedUser = babysitter.userId;
      }
    }
    
    if (!reportedUser) {
      console.error('🔥 Reported user not found:', reportedUserId);
      console.error('Looking for user ID:', reportedUserId, 'Type:', typeof reportedUserId);
      return res.status(404).json({
        success: false,
        message: 'Reported user not found',
        reportedUserId: reportedUserId
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

    // Check for duplicate reports per booking (max 2 reports per booking: one from parent, one from babysitter)
    if (bookingId) {
      const existingReport = await Report.findOne({
        bookingId,
        reporterId
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'You have already filed a report for this booking'
        });
      }

      // Check max 2 reports per booking
      const bookingReportCount = await Report.countDocuments({ bookingId });
      if (bookingReportCount >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 2 reports (one from parent, one from babysitter) per booking already reached'
        });
      }
    }

    // Check for duplicate reports (same reporter, reported user, within 24 hours) - only if no booking specified
    if (!bookingId) {
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
      .populate('reporterId', 'name email phone role')
      .populate('bookingId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Resolve reportedUserId (could be Parent ID, Babysitter ID, or User ID)
    let reportedUser = await User.findById(report.reportedUserId).select('name email role accountStatus phone');
    
    if (!reportedUser) {
      const parent = await Parent.findById(report.reportedUserId).populate('userId', 'name email role accountStatus phone');
      if (parent && parent.userId) {
        reportedUser = parent.userId;
      }
    }
    
    if (!reportedUser) {
      const babysitter = await Babysitter.findById(report.reportedUserId).populate('userId', 'name email role accountStatus phone');
      if (babysitter && babysitter.userId) {
        reportedUser = babysitter.userId;
      }
    }

    const reportData = report.toObject();
    reportData.reportedUserId = reportedUser;

    res.status(200).json({
      success: true,
      data: reportData
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

// Update report status and notes
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (status) {
      const validStatuses = ['open', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      report.status = status;
    }

    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    console.log(`✅ Report ${reportId} updated: ${status}`);

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

// Get reports for specific booking
exports.getBookingReports = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const reports = await Report.find({ bookingId })
      .populate('reporterId', 'name email role')
      .populate('reportedUserId', 'name email role')
      .populate('resolutionChangedBy', 'name email')
      .sort({ createdAt: -1 });

    const reportCount = reports.length;

    res.status(200).json({
      success: true,
      data: {
        booking: {
          _id: booking._id,
          parentId: booking.parentId,
          babysitterId: booking.babysitterId,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          paymentStatus: booking.paymentStatus,
          status: booking.status
        },
        reports,
        reportCount,
        maxReportsReached: reportCount >= 2
      }
    });

  } catch (error) {
    console.error('🔥 GET BOOKING REPORTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking reports',
      error: error.message
    });
  }
};

// Get all reports for admin with booking details
exports.getReportsWithBookings = async (req, res) => {
  try {
    const { status = 'all', limit = 10, page = 1, bookingId = null } = req.query;

    let query = {};
    
    if (status !== 'all') query.status = status;
    if (bookingId) query.bookingId = bookingId;

    const reports = await Report.find(query)
      .populate('reporterId', 'name email role accountStatus')
      .populate('bookingId', 'parentId babysitterId date startTime endTime status paymentStatus')
      .populate('resolutionChangedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Resolve reportedUserId for each report and enrich with booking details
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toObject();
        
        // Resolve reportedUserId (could be Parent ID, Babysitter ID, or User ID)
        let reportedUser = await User.findById(report.reportedUserId).select('name email role accountStatus phone');
        
        if (!reportedUser) {
          const parent = await Parent.findById(report.reportedUserId).populate('userId', 'name email role accountStatus phone');
          if (parent && parent.userId) {
            reportedUser = parent.userId;
          }
        }
        
        if (!reportedUser) {
          const babysitter = await Babysitter.findById(report.reportedUserId).populate('userId', 'name email role accountStatus phone');
          if (babysitter && babysitter.userId) {
            reportedUser = babysitter.userId;
          }
        }
        
        reportObj.reportedUserId = reportedUser;
        
        // Add booking report count
        if (reportObj.bookingId) {
          const reportCount = await Report.countDocuments({ bookingId: reportObj.bookingId._id });
          reportObj.reportCountForBooking = reportCount;
        }
        
        return reportObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        reports: enrichedReports,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('🔥 GET REPORTS WITH BOOKINGS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports with booking details',
      error: error.message
    });
  }
};

// Check if payment is completed for booking (enables reporting)
exports.checkPaymentStatusForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('parentId babysitterId', '_id');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const canReport = booking.paymentStatus === 'paid' && booking.status === 'completed';

    const payment = await Payment.findOne({ bookingId });

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        parentId: booking.parentId._id || booking.parentId,
        babysitterId: booking.babysitterId._id || booking.babysitterId,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.status,
        canReport,
        paymentDetails: payment ? {
          amount: payment.totalAmount,
          method: payment.paymentMethod,
          paidAt: payment.paidAt
        } : null
      }
    });

  } catch (error) {
    console.error('🔥 CHECK PAYMENT STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking payment status',
      error: error.message
    });
  }
};

module.exports = exports;
