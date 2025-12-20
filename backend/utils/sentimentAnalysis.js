// Simple Sentiment Analysis Engine for KINDER Platform
// This is a basic implementation. For production, consider using:
// - Natural Language Processing libraries (natural, compromise)
// - ML models (TensorFlow.js, Hugging Face)
// - Third-party APIs (Google Cloud NLP, AWS Comprehend)

const POSITIVE_WORDS = [
  'excellent', 'amazing', 'wonderful', 'great', 'good', 'fantastic', 'awesome',
  'perfect', 'love', 'best', 'professional', 'reliable', 'trustworthy', 'caring',
  'responsible', 'punctual', 'friendly', 'helpful', 'kind', 'patient', 'skilled',
  'experienced', 'recommend', 'satisfied', 'happy', 'impressed', 'outstanding'
];

const NEGATIVE_WORDS = [
  'terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'poor', 'useless',
  'unreliable', 'unprofessional', 'rude', 'careless', 'irresponsible', 'late',
  'unsafe', 'dangerous', 'incompetent', 'dishonest', 'fraud', 'scam', 'disappointed',
  'unsatisfied', 'angry', 'upset', 'disgusted', 'abusive', 'harassing'
];

const HARASSMENT_KEYWORDS = [
  'abuse', 'harassment', 'threat', 'violence', 'assault', 'discrimination',
  'racist', 'sexist', 'homophobic', 'transphobic', 'slur', 'hate', 'kill',
  'rape', 'molest', 'pedophile', 'predator', 'blackmail', 'extortion'
];

const SPAM_PATTERNS = [
  /http[s]?:\/\/[^\s]+/gi, // URLs
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
  /\d{10,}/g, // Long numbers (phone numbers)
  /([a-zA-Z])\1{4,}/g // Repeated characters
];

/**
 * Analyze sentiment of a review text
 * @param {string} text - Review text to analyze
 * @returns {object} - { score: -1 to 1, label: 'positive'|'neutral'|'negative', flagged: boolean, reason: string }
 */
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      label: 'neutral',
      flagged: false,
      reason: ''
    };
  }

  const lowerText = text.toLowerCase();
  let score = 0;
  let flagged = false;
  let reason = '';

  // Check for harassment
  for (const keyword of HARASSMENT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      flagged = true;
      reason = 'Contains harassment or abusive language';
      return {
        score: -1,
        label: 'negative',
        flagged: true,
        reason
      };
    }
  }

  // Check for spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      flagged = true;
      reason = 'Contains spam patterns (URLs, emails, etc.)';
      return {
        score: -1,
        label: 'negative',
        flagged: true,
        reason
      };
    }
  }

  // Count positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of POSITIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) positiveCount += matches.length;
  }

  for (const word of NEGATIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeCount += matches.length;
  }

  // Calculate sentiment score
  const totalWords = text.split(/\s+/).length;
  const wordDensity = Math.max(positiveCount, negativeCount) / Math.max(totalWords, 1);

  if (positiveCount > negativeCount) {
    score = Math.min(wordDensity, 1);
  } else if (negativeCount > positiveCount) {
    score = -Math.min(wordDensity, 1);
  } else {
    score = 0;
  }

  // Determine label
  let label = 'neutral';
  if (score > 0.3) {
    label = 'positive';
  } else if (score < -0.3) {
    label = 'negative';
  }

  // Check for suspicious patterns
  if (text.length < 10) {
    reason = 'Review too short';
    flagged = true;
  }

  if (positiveCount === 0 && negativeCount === 0) {
    reason = 'No sentiment indicators found';
    flagged = true;
  }

  return {
    score: parseFloat(score.toFixed(2)),
    label,
    flagged,
    reason
  };
}

/**
 * Detect fake or suspicious reviews
 * @param {string} text - Review text
 * @param {number} rating - Rating given
 * @returns {object} - { isSuspicious: boolean, reasons: string[] }
 */
function detectFakeReview(text, rating) {
  const reasons = [];

  // Check for mismatch between rating and text sentiment
  const sentiment = analyzeSentiment(text);
  
  if (rating >= 4 && sentiment.label === 'negative') {
    reasons.push('Rating-sentiment mismatch: High rating with negative text');
  }
  
  if (rating <= 2 && sentiment.label === 'positive') {
    reasons.push('Rating-sentiment mismatch: Low rating with positive text');
  }

  // Check for generic/template reviews
  const genericPhrases = [
    'great service',
    'highly recommend',
    'would use again',
    'very satisfied'
  ];

  let genericCount = 0;
  for (const phrase of genericPhrases) {
    if (text.toLowerCase().includes(phrase)) {
      genericCount++;
    }
  }

  if (genericCount >= 2) {
    reasons.push('Review appears to be templated or generic');
  }

  // Check for excessive punctuation
  const punctuationCount = (text.match(/[!?]{2,}/g) || []).length;
  if (punctuationCount > 2) {
    reasons.push('Excessive punctuation detected');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Get sentiment statistics for a user
 * @param {array} reviews - Array of review objects with rating and comment
 * @returns {object} - Statistics about reviews
 */
function getReviewStatistics(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      flaggedReviews: 0,
      trustScore: 0
    };
  }

  let totalRating = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let flaggedCount = 0;

  for (const review of reviews) {
    totalRating += review.rating || 0;
    
    const sentiment = analyzeSentiment(review.comment || '');
    
    if (sentiment.label === 'positive') positiveCount++;
    else if (sentiment.label === 'neutral') neutralCount++;
    else negativeCount++;

    if (sentiment.flagged) flaggedCount++;
  }

  const averageRating = totalRating / reviews.length;
  const totalReviews = reviews.length;

  // Calculate trust score (0-100)
  const ratingScore = (averageRating / 5) * 50; // 50% from rating
  const sentimentScore = (positiveCount / totalReviews) * 30; // 30% from positive sentiment
  const flagScore = Math.max(0, 20 - (flaggedCount * 5)); // 20% from no flags
  const trustScore = Math.round(ratingScore + sentimentScore + flagScore);

  return {
    totalReviews,
    averageRating: parseFloat(averageRating.toFixed(2)),
    sentimentDistribution: {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount
    },
    flaggedReviews: flaggedCount,
    trustScore: Math.min(100, Math.max(0, trustScore))
  };
}

module.exports = {
  analyzeSentiment,
  detectFakeReview,
  getReviewStatistics
};
