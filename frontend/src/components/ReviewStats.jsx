import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  LinearProgress,
  Grid,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, TrendingUp, ReviewsOutlined } from '@mui/icons-material';
import api from '../services/api';

const ReviewStats = ({ userId, babysitterName = '' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/reviews/stats/${userId}`);

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching review stats:', err);
      setError('Failed to load review statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <CircularProgress sx={{ color: '#FF9800' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ marginTop: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', padding: 4 }}>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          No statistics available yet
        </Typography>
      </Box>
    );
  }

  // Prepare chart data
  const ratingDistributionData = [
    { name: '5★', value: stats.ratingDistribution?.[5] || 0, color: '#4CAF50' },
    { name: '4★', value: stats.ratingDistribution?.[4] || 0, color: '#8BC34A' },
    { name: '3★', value: stats.ratingDistribution?.[3] || 0, color: '#FF9800' },
    { name: '2★', value: stats.ratingDistribution?.[2] || 0, color: '#FF7043' },
    { name: '1★', value: stats.ratingDistribution?.[1] || 0, color: '#F44336' }
  ].filter(item => item.value > 0);

  const sentimentData = [
    { name: 'Positive', value: stats.sentimentDistribution?.positive || 0, color: '#4CAF50' },
    { name: 'Neutral', value: stats.sentimentDistribution?.neutral || 0, color: '#FF9800' },
    { name: 'Negative', value: stats.sentimentDistribution?.negative || 0, color: '#F44336' }
  ].filter(item => item.value > 0);

  const totalReviews = stats.totalReviews || 0;
  const averageRating = stats.averageRating || 0;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Stats */}
      <Grid container spacing={2} sx={{ marginBottom: 3 }}>
        {/* Total Reviews Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: 'rgba(255, 152, 0, 0.15)',
              border: '2px solid rgba(255, 152, 0, 0.4)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              padding: 2
            }}
          >
            <ReviewsOutlined sx={{ fontSize: 32, color: '#FF9800', marginBottom: 1 }} />
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#FF9800' }}>
              {totalReviews}
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              Total Reviews
            </Typography>
          </Card>
        </Grid>

        {/* Average Rating Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              border: '2px solid rgba(76, 175, 80, 0.4)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              padding: 2
            }}
          >
            <Star sx={{ fontSize: 32, color: '#4CAF50', marginBottom: 1 }} />
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#4CAF50' }}>
              {averageRating.toFixed(1)}
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              Average Rating
            </Typography>
          </Card>
        </Grid>

        {/* Rating Display */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              padding: 2,
              textAlign: 'center'
            }}
          >
            <Box sx={{ marginBottom: 1 }}>
              <Rating value={Math.round(averageRating)} readOnly size="large" sx={{ '& .MuiRating-iconFilled': { color: '#FF9800' } }} />
            </Box>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Typography>
          </Card>
        </Grid>

        {/* Sentiment Summary */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              padding: 2
            }}
          >
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, marginBottom: 1.5, fontSize: '0.9rem' }}>
              Sentiment
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sentimentData.length > 0 ? (
                sentimentData.map(item => (
                  <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ color: item.color, fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
                  No sentiment data
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Rating Distribution */}
        {ratingDistributionData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                padding: 2.5
              }}
            >
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#FF9800' }} />
                Rating Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 46, 0.95)',
                      border: '1px solid rgba(255, 152, 0, 0.5)',
                      borderRadius: 8,
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="value" fill="#FF9800" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}

        {/* Sentiment Distribution */}
        {sentimentData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                padding: 2.5
              }}
            >
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#FF9800' }} />
                Sentiment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 46, 0.95)',
                      border: '1px solid rgba(255, 152, 0, 0.5)',
                      borderRadius: 8,
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Rating Breakdown */}
      {ratingDistributionData.length > 0 && (
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 152, 0, 0.2)',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            padding: 2.5,
            marginTop: 3
          }}
        >
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700, marginBottom: 2 }}>
            Review Count by Rating
          </Typography>
          {ratingDistributionData.map((item) => (
            <Box key={item.name} sx={{ marginBottom: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 0.5 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                  {item.name}
                </Typography>
                <Typography sx={{ color: item.color, fontWeight: 600 }}>
                  {item.value} review{item.value !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(item.value / totalReviews) * 100}
                sx={{
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: item.color
                  }
                }}
              />
            </Box>
          ))}
        </Card>
      )}
    </Box>
  );
};

export default ReviewStats;
