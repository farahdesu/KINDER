import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Error } from '@mui/icons-material';

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');
  const message = searchParams.get('message');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="sm">
        <Paper sx={{ padding: 4, textAlign: 'center' }}>
          <Error sx={{ fontSize: 80, color: '#f44336', marginBottom: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2, color: '#333' }}>
            Payment Failed!
          </Typography>
          <Typography sx={{ color: '#666', marginBottom: 3 }}>
            {message || 'Unfortunately, your payment could not be processed.'}
          </Typography>
          {transactionId && (
            <Box sx={{ backgroundColor: '#ffebee', padding: 2, borderRadius: 2, marginBottom: 3 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Transaction ID: <strong>{transactionId}</strong>
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              sx={{ color: '#666', borderColor: '#666' }}
              onClick={() => navigate('/parent-bookings')}
            >
              View Bookings
            </Button>
            <Button 
              variant="contained" 
              sx={{ backgroundColor: '#03A9F4' }}
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

export default PaymentError;