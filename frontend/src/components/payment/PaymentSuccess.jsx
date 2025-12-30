import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');
  const amount = searchParams.get('amount');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="sm">
        <Paper sx={{ padding: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', marginBottom: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2, color: '#333' }}>
            Payment Successful!
          </Typography>
          <Typography sx={{ color: '#666', marginBottom: 3 }}>
            Your payment has been processed successfully.
          </Typography>
          <Box sx={{ backgroundColor: '#e8f5e9', padding: 2, borderRadius: 2, marginBottom: 3 }}>
            <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
              Transaction ID: <strong>{transactionId}</strong>
            </Typography>
            {amount && (
              <Typography sx={{ fontSize: '0.9rem', color: '#666', marginTop: 1 }}>
                Amount: <strong>৳{amount}</strong>
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined"
              sx={{ color: '#03A9F4', borderColor: '#03A9F4' }}
              onClick={() => navigate('/parent-bookings')}
            >
              View Bookings
            </Button>
            <Button 
              variant="contained" 
              sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45a049' } }}
              onClick={() => navigate('/parent-dashboard')}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PaymentSuccess;