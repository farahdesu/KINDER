import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KinderLogo from '../assets/KinderLogo.png';
import {
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Radio,
  FormControlLabel,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  Container,
} from '@mui/material';
import {
  Email,
  Lock,
  Person,
  Phone,
  Visibility,
  VisibilityOff,
  ArrowBack,
  School,
  CheckCircle,
} from '@mui/icons-material';
import './RegisterForm.css';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: role, Step 2: form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parent",
    phone: "",
    university: "",
    studentId: "",
    department: "",
    year: "",
    skills: "",
    experience: "Beginner (0-1 years)",
    hourlyRate: "",
    bio: ""
  });
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For student ID, only allow numbers and limit to 8 digits
    if (name === 'studentId') {
      const numValue = value.replace(/\D/g, '').slice(0, 8);
      setFormData({
        ...formData,
        [name]: numValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (formData.role === "parent" && !formData.phone) {
      setMessage("Phone number is required for parents");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (formData.role === "babysitter") {
      const requiredFields = ['university', 'studentId', 'department', 'year', 'hourlyRate'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setMessage(`Missing required fields: ${missingFields.join(', ')}`);
        setMessageType("error");
        setLoading(false);
        return;
      }
      
      const studentIdRegex = /^\d{8}$/;
      if (!studentIdRegex.test(formData.studentId)) {
        setMessage("Student ID must be exactly 8 digits (e.g., 20241234)");
        setMessageType("error");
        setLoading(false);
        return;
      }
      
      const rate = parseFloat(formData.hourlyRate);
      if (isNaN(rate) || rate < 100 || rate > 1000) {
        setMessage("Hourly rate must be between 100 and 1000 BDT");
        setMessageType("error");
        setLoading(false);
        return;
      }
      
      const year = parseInt(formData.year);
      if (isNaN(year) || year < 1 || year > 5) {
        setMessage("Academic year must be between 1 and 5");
        setMessageType("error");
        setLoading(false);
        return;
      }
    }

    try {
      console.log("Sending to backend:", formData);
      
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.role === "parent" ? formData.phone : undefined,
          ...(formData.role === "babysitter" && {
            university: formData.university,
            studentId: formData.studentId,
            department: formData.department,
            year: parseInt(formData.year),
            skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : ['Childcare', 'Homework Help', 'First Aid'],
            experience: formData.experience,
            hourlyRate: parseFloat(formData.hourlyRate),
            bio: formData.bio || ""
          })
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage("Account created successfully!");
        setMessageType("success");
        setShowSuccessModal(true);
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "parent",
          phone: "",
          university: "",
          studentId: "",
          department: "",
          year: "",
          skills: "",
          experience: "Beginner (0-1 years)",
          hourlyRate: "",
          bio: ""
        });
        setStep(1);
      } else {
        setMessage(data.message || "Registration failed");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Cannot connect to backend. Make sure it's running.");
      setMessageType("error");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <Box
      className="register-page-wrapper"
      sx={{
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '20px',
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => navigate('/login')}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
          },
          zIndex: 10,
        }}
      >
        <ArrowBack />
      </IconButton>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onClose={handleSuccessClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircle
            sx={{
              fontSize: 80,
              color: '#4caf50',
              mb: 2,
              animation: 'bounceIn 0.8s ease-out',
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
            Welcome to KINDER!
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
            Your account has been created successfully. We're redirecting you to login...
          </Typography>
          <Button
            onClick={handleSuccessClose}
            variant="contained"
            sx={{
              backgroundColor: '#333',
              color: 'white',
              padding: '10px 40px',
              borderRadius: '8px',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#1a1a1a',
              },
            }}
          >
            Go to Login
          </Button>
        </DialogContent>
      </Dialog>

      {/* Terms & Conditions Modal */}
      <Dialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#333' }}>
          Terms & Conditions
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
            Welcome to KINDER, a trusted babysitting platform connecting parents with qualified university student babysitters.
            <br />
            <br />
            <strong>1. User Responsibilities:</strong>
            <br />
            Parents and Babysitters agree to provide accurate, truthful information during registration. Both parties commit to respectful, safe, and professional interactions.
            <br />
            <br />
            <strong>2. Age & Eligibility:</strong>
            <br />
            Babysitters must be current university students aged 18 or above. Parents must be legal guardians.
            <br />
            <br />
            <strong>3. Payment & Booking:</strong>
            <br />
            Payments are made directly between users at the agreed hourly rate. KINDER does not handle financial transactions.
            <br />
            <br />
            <strong>4. Safety & Conduct:</strong>
            <br />
            All users agree to maintain a safe, professional environment. Any illegal or harmful conduct will result in account suspension.
            <br />
            <br />
            <strong>5. Liability:</strong>
            <br />
            KINDER is a platform connecting users and is not liable for disputes or accidents between parties.
            <br />
            <br />
            By creating an account, you agree to these terms.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTerms(false)} sx={{ color: '#333' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#333' }}>
          Privacy Policy
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
            KINDER is committed to protecting your privacy.
            <br />
            <br />
            <strong>1. Information Collection:</strong>
            <br />
            We collect personal information (name, email, phone) to facilitate connections between parents and babysitters.
            <br />
            <br />
            <strong>2. Data Usage:</strong>
            <br />
            Your data is used only to provide KINDER services and is never shared with third parties without consent.
            <br />
            <br />
            <strong>3. Data Security:</strong>
            <br />
            We use industry-standard encryption and security measures to protect your information.
            <br />
            <br />
            <strong>4. Your Rights:</strong>
            <br />
            You have the right to access, modify, or delete your personal data at any time.
            <br />
            <br />
            <strong>5. Contact Us:</strong>
            <br />
            For privacy concerns, contact us through the KINDER platform.
            <br />
            <br />
            We may update this policy periodically. Changes will be notified via email.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrivacy(false)} sx={{ color: '#333' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Registration Form */}
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideUp 0.8s ease-out',
          }}
      >
        {/* Logo Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img
            src={KinderLogo}
            alt="KINDER"
            style={{
              height: '80px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              animation: 'bounceIn 0.8s ease-out',
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            mb: 1,
            color: 'white',
            animation: 'fadeInDown 0.8s ease-out 0.1s backwards',
          }}
        >
          Create Account
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mb: 3,
            color: 'rgba(255, 255, 255, 0.9)',
            animation: 'fadeInDown 0.8s ease-out 0.2s backwards',
          }}
        >
          Join KINDER and find the perfect match
        </Typography>

        {/* Error Alert */}
        {message && messageType === "error" && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: 'rgba(211, 47, 47, 0.9)',
              color: 'white',
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: 'white',
              },
            }}
          >
            {message}
          </Alert>
        )}

        {/* STEP 1: Role Selection */}
        {step === 1 && (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 'bold',
              }}
            >
              I want to join as:
            </Typography>

            <RadioGroup
              value={formData.role}
              onChange={handleChange}
              name="role"
              sx={{ mb: 3 }}
            >
              <FormControlLabel
                value="parent"
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body1"
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'white',
                      fontSize: '18px',
                      m: 0,
                      p: 0
                    }}
                  >
                    Parent
                  </Typography>
                }
                sx={{
                  mb: 2,
                  pl: 1.5,
                  pr: 2,
                  py: 1.8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  border: formData.role === 'parent' 
                    ? '2px solid rgba(255, 255, 255, 0.5)' 
                    : '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  backgroundColor: formData.role === 'parent'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                  },
                  cursor: 'pointer',
                }}
              />

              <FormControlLabel
                value="babysitter"
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body1"
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'white',
                      fontSize: '18px',
                      m: 0,
                      p: 0
                    }}
                  >
                    Babysitter
                  </Typography>
                }
                sx={{
                  pl: 1.5,
                  pr: 2,
                  py: 1.8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  border: formData.role === 'babysitter' 
                    ? '2px solid rgba(255, 255, 255, 0.5)' 
                    : '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  backgroundColor: formData.role === 'babysitter'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                  },
                  cursor: 'pointer',
                }}
              />
            </RadioGroup>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#333',
                color: 'white',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                },
              }}
            >
              Continue
            </Button>
          </Box>
        )}

        {/* STEP 2: Registration Form */}
        {step === 2 && (
          <Box component="form" onSubmit={handleSubmit}>
            {/* Back Button */}
            <Button
              onClick={() => setStep(1)}
              startIcon={<ArrowBack />}
              sx={{
                color: 'white',
                mb: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Back
            </Button>

            {/* Basic Information Section */}
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 'bold',
              }}
            >
              Basic Information
            </Typography>

            {/* Name Field */}
            <Box sx={{ marginBottom: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                Full Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#333' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#333',
                    padding: '10px 12px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.8)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '10px 8px',
                    fontSize: '0.95rem'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(51, 51, 51, 0.5)',
                    opacity: 1
                  }
                }}
              />
            </Box>

            <Box sx={{ marginBottom: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                Email Address *
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#333' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#333',
                    padding: '10px 12px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.8)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '10px 8px',
                    fontSize: '0.95rem'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(51, 51, 51, 0.5)',
                    opacity: 1
                  }
                }}
              />
            </Box>

            <Box sx={{ marginBottom: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                Password *
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#333' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#333' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#333',
                    padding: '10px 12px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.8)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '10px 8px',
                    fontSize: '0.95rem'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(51, 51, 51, 0.5)',
                    opacity: 1
                  }
                }}
              />
            </Box>

            <Box sx={{ marginBottom: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                Confirm Password *
              </Typography>
              <TextField
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#333' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: '#333' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#333',
                    padding: '10px 12px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.8)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '10px 8px',
                    fontSize: '0.95rem'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(51, 51, 51, 0.5)',
                    opacity: 1
                  }
                }}
              />
            </Box>

            {/* Parent Fields */}
            {formData.role === 'parent' && (
              <Box sx={{ marginBottom: 2 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                  Phone Number *
                </Typography>
                <TextField
                  fullWidth
                  type="tel"
                  placeholder="+880 1712345678"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: '#333' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#333',
                      padding: '10px 12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.8)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fff'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '10px 8px',
                      fontSize: '0.95rem'
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: 'rgba(51, 51, 51, 0.5)',
                      opacity: 1
                    }
                  }}
                />
              </Box>
            )}

            {/* Babysitter Fields */}
            {formData.role === 'babysitter' && (
              <>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    mt: 2,
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 'bold',
                  }}
                >
                  University Details
                </Typography>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    University *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="BRAC University"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <School sx={{ color: '#333' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(51, 51, 51, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Student ID (8 digits) *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="20241234"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    maxLength="8"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(51, 51, 51, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginTop: 0.5 }}>
                    {formData.studentId.length === 8 ? '✓ Valid' : `${8 - formData.studentId.length} digits remaining`}
                  </Typography>
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Department *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Computer Science"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(51, 51, 51, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Academic Year *
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    SelectProps={{
                      native: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& select': {
                        color: '#333',
                      },
                      '& option': {
                        backgroundColor: 'white',
                        color: '#333',
                        padding: '5px',
                      },
                    }}
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                  </TextField>
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Hourly Rate (BDT) *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="300"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 100, max: 1000, step: 50 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(51, 51, 51, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Experience Level *
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    SelectProps={{
                      native: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& select': {
                        color: '#333',
                      },
                      '& option': {
                        backgroundColor: 'white',
                        color: '#333',
                        padding: '5px',
                      },
                    }}
                  >
                    <option value="Beginner (0-1 years)">Beginner (0-1 years)</option>
                    <option value="Intermediate (1-3 years)">Intermediate (1-3 years)</option>
                    <option value="Experienced (3+ years)">Experienced (3+ years)</option>
                  </TextField>
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Skills (comma separated) *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Childcare, Homework Help, First Aid, Cooking"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(51, 51, 51, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>

                <Box sx={{ marginBottom: 2 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 500, marginBottom: 0.5 }}>
                    Bio/Introduction *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Tell parents about yourself, your experience with children, etc."
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    inputProps={{ maxLength: 500 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '10px 12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.8)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fff'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '10px 8px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(51, 51, 51, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>
              </>
            )}

            {/* Legal Links */}
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                By registering, you agree to our{' '}
                <Button
                  size="small"
                  onClick={() => setShowTerms(true)}
                  sx={{
                    color: 'white',
                    textDecoration: 'underline',
                    p: 0,
                    '&:hover': { backgroundColor: 'transparent' },
                  }}
                >
                  Terms & Conditions
                </Button>
                {' '}and{' '}
                <Button
                  size="small"
                  onClick={() => setShowPrivacy(true)}
                  sx={{
                    color: 'white',
                    textDecoration: 'underline',
                    p: 0,
                    '&:hover': { backgroundColor: 'transparent' },
                  }}
                >
                  Privacy Policy
                </Button>
              </Typography>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: '#333',
                color: 'white',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                },
                '&:disabled': {
                  backgroundColor: '#999',
                },
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                mt: 2,
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Already have an account?{' '}
              <Button
                onClick={() => navigate('/login')}
                sx={{
                  color: 'white',
                  textDecoration: 'underline',
                  p: 0,
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                Login here
              </Button>
            </Typography>
          </Box>
        )}
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterForm;