# LoginPage Customization Guide

## Overview
The LoginPage has been refactored to use Material UI components with a clean, modern design. It's now easy to customize with your own logo and background image.

## How to Add Your Custom Logo

### Step 1: Place Your Logo Image
1. Create a `public` folder in your frontend directory if it doesn't already exist
2. Place your logo image in `public/` folder
3. Example: `public/logo.png` or `public/logo.svg`

### Step 2: Update the LoginPage Component
In `src/components/LoginPage.jsx`, find this section:
```jsx
<Box
  component="img"
  src="/logo.png" // ← Change this path to your logo
  alt="KINDER Logo"
  sx={{
    height: 60,
    marginBottom: 1
  }}
/>
```

Change `/logo.png` to your actual logo file name. For example:
- `/my-custom-logo.png`
- `/kinder-logo.svg`
- `/logo-dark.png`

## How to Add Your Custom Background Image

### Step 1: Place Your Background Image
1. Place your background image in `public/` folder
2. Example: `public/background.jpg` or `public/bg.png`

### Step 2: Update the CSS
In `src/components/LoginPage.css`, find the `.login-page-wrapper` section:
```css
.login-page-wrapper {
  /* TO ADD YOUR BACKGROUND IMAGE, USE THIS PROPERTY */
  /* background-image: url('/path-to-your-image.jpg'); */
  
  /* Default fallback gradient */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

Uncomment and update the `background-image` property:
```css
.login-page-wrapper {
  background-image: url('/background.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  
  /* Fallback for when image doesn't load */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

## Color Customization

### Primary Color (Purple)
To change the primary purple color (#673AB7), do a find and replace:
- Find: `#673AB7`
- Replace: `#YourColorCode`

### Secondary Color (Darker Purple)
- Find: `#512DA8`
- Replace: `#YourColorCode`

## Advanced Customization

### Change Logo Size
In `LoginPage.jsx`:
```jsx
sx={{
  height: 60,  // ← Change this value (in pixels)
  marginBottom: 1
}}
```

### Change Form Width
In `LoginPage.jsx`:
```jsx
<Container maxWidth="sm">  {/* Change 'sm' to 'xs', 'md', 'lg', 'xl' */}
```

### Change Paper (Form Container) Elevation
In `LoginPage.jsx`:
```jsx
<Paper
  elevation={8}  {/* Change this number (0-24) for shadow depth */}
```

### Background Image Opacity
To add a semi-transparent overlay on your background:
```css
.login-page-wrapper {
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('/background.jpg');
  background-size: cover;
  background-position: center;
}
```
Adjust `0.5` to your preferred opacity (0 = transparent, 1 = opaque)

## Features Included

✅ Material UI components for modern design
✅ No blue gradient (removed as requested)
✅ Clean "Welcome" text instead of "Welcome Back"
✅ "Login" button instead of "Sign in to dashboard"
✅ Google/Facebook login options removed
✅ Parent/Babysitter toggle using Material UI ToggleButtonGroup
✅ Responsive design for mobile and desktop
✅ Password visibility toggle
✅ Remember me checkbox
✅ Error alerts with Material UI
✅ Accessibility features (keyboard navigation, focus visible)
✅ Smooth transitions and animations

## Material UI Theme Colors Used

- Primary: `#673AB7` (Purple)
- Secondary: `#512DA8` (Dark Purple)
- Background: White with 95% opacity
- Borders: `#e0e0e0` (Light Gray)
- Text: `#1a1a1a` (Dark Gray)

## Responsive Breakpoints

The form is optimized for:
- Mobile (< 600px)
- Tablet (600px - 960px)
- Desktop (> 960px)

## Test Accounts (Development Only)

Parent: `parent@example.com` / `password123`
Babysitter: `student@bracu.ac.bd` / `password123`

These are only shown in development mode.

---

For more customization help, check Material UI documentation at:
https://mui.com/components/
