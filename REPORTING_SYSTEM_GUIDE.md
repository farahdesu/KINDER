# 📋 REPORTING SYSTEM IMPLEMENTATION GUIDE

## Overview
Complete reporting system implemented with full workflow:
- **Parents & Babysitters** can submit reports after payment completion
- **Maximum 2 reports per booking** (1 from parent, 1 from babysitter)
- **Admin Dashboard** with full report management interface
- **Account enforcement** (warning, suspension, ban)
- **Payment completion** validation before reporting

---

## IMPLEMENTATION COMPLETED

### 1. **Backend: User Model Enhancement** ✅
**File:** `backend/models/User.js`

**Added Fields:**
```javascript
accountStatus: enum ['active', 'warned', 'suspended', 'banned'] (default: 'active')
accountStatusReason: String (reason for status change)
accountStatusChangedAt: Date (when status was changed)
accountStatusChangedBy: ObjectId → User (admin who made change)
```

**Impact:** Enforces account restrictions for violated users

---

### 2. **Backend: Report Model Enhancement** ✅
**File:** `backend/models/Report.js`

**Added Fields & Indexes:**
```javascript
resolutionChangedBy: ObjectId → User (tracks who applied resolution)
resolutionUpdatedAt: Date (when resolution was applied)

// Unique index: One report per reporter per booking
Index: { bookingId: 1, reporterId: 1 } with unique: true, sparse: true
```

**Impact:** Enforces max 2 reports per booking (one from each user)

---

### 3. **Backend: Report Controller Enhancement** ✅
**File:** `backend/controllers/reportController.js`

**Enhanced Functions:**

#### `submitReport()`
- ✅ Validates booking-specific reports (max 2 per booking)
- ✅ Prevents duplicate reports from same user on same booking
- ✅ Generates correct severity levels
- ✅ Supports optional booking reference

#### `updateReport()`
**New Enforcement Logic:**
- **Warning** → Sets `accountStatus = 'warned'`
- **Suspension** → Sets `accountStatus = 'suspended'`
- **Ban** → Sets `accountStatus = 'banned'`
- **No Action** → Resets `accountStatus = 'active'`
- Tracks admin who applied resolution
- Creates notifications for user
- Records timestamp of resolution

#### **New Functions Added:**

##### `getBookingReports()` - GET `/api/reports/booking/:bookingId`
Returns all reports for a specific booking with:
- Report count (max 2)
- Full reporter/reported user details
- Booking status and payment info

##### `getReportsWithBookings()` - GET `/api/reports/admin/all`
Admin endpoint returning:
- All reports with booking context
- User account statuses
- Report count per booking
- Enriched with resolution details

##### `checkPaymentStatusForBooking()` - GET `/api/reports/check-payment/:bookingId`
Validates payment completion before allowing report submission:
- Booking status: `completed`
- Payment status: `paid`
- Returns: `canReport` boolean

---

### 4. **Backend: Authentication Middleware** ✅
**File:** `backend/middleware/auth.js`

**Enhanced `protect` Middleware:**
```javascript
// NEW: Check user account status
if (user.accountStatus === 'suspended') {
  return 403 error: "Your account has been temporarily suspended"
}
if (user.accountStatus === 'banned') {
  return 403 error: "Your account has been permanently banned"
}
```

**Impact:** Prevents suspended/banned users from accessing platform

---

### 5. **Backend: Report Routes** ✅
**File:** `backend/routes/reportRoutes.js`

**New Endpoints:**
```javascript
POST   /api/reports                          // Submit report
GET    /api/reports/my-reports               // User's own reports
GET    /api/reports/check-payment/:bookingId // Verify payment status
GET    /api/reports/booking/:bookingId       // Reports for specific booking
GET    /api/reports/admin/all                // Admin: All reports with bookings
GET    /api/reports/admin/stats              // Admin: Report statistics
GET    /api/reports/admin/:reportId          // Admin: Single report details
PUT    /api/reports/admin/:reportId          // Admin: Update report status/resolution
```

---

### 6. **Frontend: Admin Reports Component** ✅
**File:** `frontend/src/components/admin/AdminReports.jsx`
**CSS:** `frontend/src/components/admin/AdminReports.css`

**Features:**
- 📊 Statistics dashboard (total, open, under review, resolved)
- 🔍 Filter by status
- 📋 Reports table with:
  - Reporter/Reported user info
  - Report category & severity badges
  - Current account status of reported user
  - Booking reference with report count
  - Created date
- 📖 Detail modal with:
  - Full report information
  - Account status of reported user
  - **Admin Action Section:**
    - Change report status (open → under review → resolved/dismissed)
    - Apply resolution (warning, suspension, ban, no_action)
    - Add admin notes
    - Track who made changes

**Styling:**
- Color-coded status/severity/resolution badges
- Responsive design (mobile, tablet, desktop)
- Modal for detailed review

---

### 7. **Frontend: Report Submission Component** ✅
**File:** `frontend/src/components/ReportSubmission.jsx`
**CSS:** `frontend/src/components/ReportSubmission.css`

**Features:**
- ✅ Payment completion check before allowing report
- ✅ Prevents duplicate reports (check if user already reported)
- ✅ Category selection (misconduct, harassment, safety, fraud, other)
- ✅ Description textarea (20-1000 characters)
- ✅ Character counter with validation
- ✅ Important information box
- ✅ Submit/Cancel buttons with loading states

**Validation:**
- Payment status: `paid` + Booking status: `completed`
- Description length: 20-1000 characters
- One report per user per booking

**UI States:**
1. **Not Ready** - Shows booking/payment status if not complete
2. **Already Reported** - Shows message if user already submitted
3. **Ready** - Full form for report submission

---

### 8. **Frontend: Admin Dashboard Integration** ✅
**File:** `frontend/src/components/admin/AdminDashboard.jsx`

**Changes:**
- ✅ Import AdminReports component
- ✅ Added "Reports" tab with Warning icon
- ✅ Tab index 3 renders AdminReports component

**Tab Structure:**
```
Tab 0: Users Management
Tab 1: Bookings Management
Tab 2: Verifications (pending approvals)
Tab 3: Reports (NEW) ⭐
```

---

## WORKFLOW DOCUMENTATION

### 📌 **Reporting Workflow**

#### **Step 1: Booking Completion**
1. Parent books babysitter
2. Babysitter confirms booking
3. Booking status moves to: `pending` → `confirmed` → `completed`

#### **Step 2: Payment Processing**
1. After booking completion, payment must be processed
2. Payment status: `pending` → `completed`
3. Booking.paymentStatus: `pending` → `paid`

#### **Step 3: Report Submission** (Optional)
**Parent or Babysitter can report:**
1. Opens report modal/component
2. Component checks: `payment.status === 'paid'` AND `booking.status === 'completed'`
3. Component prevents duplicate: checks existing reports for booking + reporter
4. If eligible, submits report with:
   - Category (harassment, misconduct, safety_concern, fraud, other)
   - Description (20-1000 chars)
   - BookingId reference
   - ReporterId (auto-filled)
   - ReportedUserId (opposite party)
5. System validates: max 2 reports per booking

#### **Step 4: Admin Review** 
1. Admin views Reports tab in dashboard
2. Admin can:
   - Filter by status (open, under_review, resolved, dismissed)
   - View report details in modal
   - Change report status (admin can change anytime)
   - Apply resolution with reasons:
     - **Warning** → User account status: `warned`
     - **Suspension** → User account status: `suspended` (can't access platform)
     - **Ban** → User account status: `banned` (permanent)
     - **No Action** → User account status: `active` (reverts any previous action)
   - Add admin notes for transparency

#### **Step 5: Enforcement**
1. When user tries to login:
   - Auth middleware checks `accountStatus`
   - If `suspended` or `banned`: returns 403 error
   - User is blocked from platform access
2. Notifications sent to user about resolution

---

## API REFERENCE

### **Report Submission**
```
POST /api/reports
Headers: Authorization: Bearer {token}

Body:
{
  "bookingId": "id",
  "reportedUserId": "id",
  "category": "misconduct",
  "description": "Detailed description..."
}

Response:
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "_id": "reportId",
    "status": "open",
    "severity": "medium",
    "createdAt": "..."
  }
}
```

### **Check Payment Status** (for UI)
```
GET /api/reports/check-payment/:bookingId
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "canReport": true,
    "paymentStatus": "paid",
    "bookingStatus": "completed"
  }
}
```

### **Get Booking Reports**
```
GET /api/reports/booking/:bookingId
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "reports": [...],
    "reportCount": 1,
    "maxReportsReached": false
  }
}
```

### **Admin: Update Report**
```
PUT /api/reports/admin/:reportId
Headers: Authorization: Bearer {token}, Role: admin

Body:
{
  "status": "resolved",
  "resolution": "suspension",
  "adminNotes": "Violation of community guidelines..."
}

Response:
{
  "success": true,
  "message": "Report updated successfully",
  "data": {
    "_id": "reportId",
    "status": "resolved",
    "resolution": "suspension",
    "accountStatus": "suspended" (of reported user)
  }
}
```

---

## INTEGRATION WITH BOOKING COMPONENTS

### **How to Integrate Report Button in Booking Pages**

#### Example: After Booking Completion Page
```jsx
import ReportSubmission from '../ReportSubmission';

const BookingDetail = ({ bookingId }) => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div>
      {/* Other booking details */}
      
      {/* Show report button only if booking is completed and paid */}
      <button onClick={() => setShowReportModal(true)}>
        📋 Report Issue (Optional)
      </button>

      {showReportModal && (
        <ReportSubmission
          bookingId={bookingId}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
            alert('Report submitted!');
          }}
        />
      )}
    </div>
  );
};
```

---

## RULES & CONSTRAINTS

### **Reporting Rules**
| Rule | Detail |
|------|--------|
| **Max Reports** | 2 per booking (1 parent + 1 babysitter max) |
| **One Per User** | Each user can only report once per booking |
| **Payment Required** | Booking must be completed + payment done |
| **Description** | 20-1000 characters required |
| **Categories** | harassment, misconduct, safety_concern, fraud, other |

### **Admin Resolution Rules**
| Resolution | Action | Effect |
|-----------|--------|--------|
| **Warning** | Notifies user | accountStatus = 'warned' |
| **Suspension** | Blocks user | accountStatus = 'suspended' |
| **Ban** | Permanent block | accountStatus = 'banned' |
| **No Action** | Dismisses | accountStatus = 'active' |

### **Admin Flexibility** ⭐
- Admin can change report status **anytime** (not locked to workflow)
- Admin can change resolution **anytime**
- Previous resolutions can be reverted
- Changes are tracked with timestamp & admin ID

---

## TESTING CHECKLIST

### Backend Testing
- [ ] Submit report without payment → Validate error
- [ ] Submit 2 reports on same booking → Success
- [ ] Submit 3rd report on same booking → Error
- [ ] User A reports User B, User B reports User A on same booking → Both succeed
- [ ] Update report to suspension → Check accountStatus = suspended
- [ ] Try login as suspended user → 403 error
- [ ] Admin reverts to "no_action" → accountStatus = active
- [ ] Try login as reverted user → Success

### Frontend Testing
- [ ] ReportSubmission shows payment incomplete → Form disabled
- [ ] ReportSubmission shows already reported → Different message
- [ ] Submit report → Modal closes, success message
- [ ] Admin views Reports tab → Table loads
- [ ] Admin filters by status → Correct reports shown
- [ ] Admin opens detail modal → Full info displayed
- [ ] Admin applies suspension → User account status changes
- [ ] Admin changes status anytime → No errors

---

## FILES MODIFIED/CREATED

### Backend
- ✅ `backend/models/User.js` - Enhanced with account status
- ✅ `backend/models/Report.js` - Enhanced with validation index
- ✅ `backend/controllers/reportController.js` - 5 new functions
- ✅ `backend/middleware/auth.js` - Account status enforcement
- ✅ `backend/routes/reportRoutes.js` - 4 new endpoints

### Frontend
- ✅ `frontend/src/components/admin/AdminReports.jsx` - New
- ✅ `frontend/src/components/admin/AdminReports.css` - New
- ✅ `frontend/src/components/ReportSubmission.jsx` - New
- ✅ `frontend/src/components/ReportSubmission.css` - New
- ✅ `frontend/src/components/admin/AdminDashboard.jsx` - Enhanced

---

## NEXT STEPS (Optional Phase 2)

1. **Evidence Attachments** - Allow file uploads with reports
2. **Report Comments** - Admin-user conversation on reports
3. **Appeal System** - Users can appeal suspensions/bans
4. **Automated Actions** - Suspension auto-lifts after X days
5. **Report Analytics** - Trends, patterns, reporter reliability
6. **Payment Refunds** - Refund parent if babysitter banned
7. **Sentiment Analysis** - Auto-detect severity from description
8. **Dispute Resolution** - Multi-step arbitration process

---

## SECURITY CONSIDERATIONS

✅ **Implemented:**
- Reports tied to bookings (prevents random false reports)
- Payment validation before allowing reports
- Admin-only enforcement actions
- Account status checked on every request
- Notifications sent to reported users
- Admin actions tracked with timestamps & user IDs

⚠️ **Recommend:**
- Rate limiting on report submission (prevent spam)
- IP-based duplicate detection
- Appeal mechanism with evidence support
- Automated suspension review after X days
- Report pattern analysis for false reporters

---

## TROUBLESHOOTING

### Issue: "You have already reported this user in the last 24 hours"
- This only applies to non-booking reports
- Booking reports have stricter validation (max 1 per user per booking)
- Solution: Check if user already reported this specific booking

### Issue: User account is suspended but they still access platform
- Clear browser cache/session
- Check backend logs for auth middleware
- Verify accountStatus field is updated correctly
- Test with fresh login

### Issue: Admin can't change report status
- Ensure user is logged in as admin
- Verify admin role in token
- Check network tab for 403 errors
- Ensure report ID is valid

---

## SUPPORT

For implementation questions or issues:
1. Check the rules & constraints section
2. Review the workflow documentation
3. Test with API reference examples
4. Check logs for specific error messages
