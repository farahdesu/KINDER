# Password Reset with Gmail Setup Guide

## Overview
The password reset feature now sends real emails through Gmail. Users will receive a password reset link in their email inbox.

## Setup Instructions

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to https://myaccount.google.com
2. Click "Security" in the left menu
3. Under "How you sign in to Google", enable "2-Step Verification"
4. Follow the prompts to add a phone number

### Step 2: Generate Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
In `backend/.env`, update these lines:

```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=abcd efgh ijkl mnop
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `abcd efgh ijkl mnop` with the 16-character App Password from Step 2

### Step 4: Restart Backend Server
After updating the .env file, restart your backend:

```bash
cd backend
npm start
```

You should see: `✅ EMAIL SERVICE: Ready to send emails`

## How It Works

### User Flow:
1. User clicks "Forgot password?" on login page
2. User enters their email address
3. Backend generates a secure reset token (1-hour expiration)
4. **Email is sent** to user's Gmail inbox with reset link
5. User clicks link in email → Reset password page opens
6. User creates new password → Password is updated in database
7. User logs in with new password

### Security Features:
- Reset tokens expire after 1 hour
- Tokens are hashed before storage
- Password must be at least 6 characters
- Passwords must match confirmation
- Invalid or expired tokens are rejected

## Testing Without Gmail Setup

If you haven't configured Gmail yet:
1. The password reset still works locally
2. Check the backend console for the test token
3. Manually navigate to: `http://localhost:3000/reset-password/{token}`
4. Reset your password

Once Gmail is configured, users will automatically receive emails.

## Troubleshooting

### "Email service not configured" Message
- Gmail credentials are not set in .env
- Check that GMAIL_USER and GMAIL_PASSWORD are both set
- Restart the backend server

### "Invalid username or password"
- The App Password may be incorrect
- Generate a new App Password from https://myaccount.google.com/apppasswords
- Make sure you copied it correctly (no extra spaces)

### Emails not arriving
- Check spam/promotions folder
- Wait a few seconds for email to arrive
- Check backend console logs for errors

## File Changes Made

- `backend/utils/emailService.js` - Email sending utility with Nodemailer
- `backend/controllers/authController.js` - Updated forgotPassword to send emails
- `backend/.env` - Added GMAIL_USER and GMAIL_PASSWORD variables
- `frontend/src/components/ForgotPasswordPage.jsx` - Updated to remove token from response
- `frontend/src/components/ResetPasswordPage.jsx` - Accesses reset page via URL only

## Security Note
- Never commit the .env file with real Gmail credentials to version control
- Use environment variables in production
- Consider using a dedicated service account for emails
- For production, use OAuth2 instead of App Passwords

