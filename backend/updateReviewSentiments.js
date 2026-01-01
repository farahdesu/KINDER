const mongoose = require('mongoose');
const sentiment = require('./utils/sentimentAnalysis.js');
require('dotenv').config();

// Import Review model
const Review = require('./models/Review.js');

async function updateReviewSentiments() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kinder';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get all reviews
    const reviews = await Review.find();
    console.log(`📋 Found ${reviews.length} reviews to update\n`);

    let updated = 0;
    let errors = 0;

    // Process each review
    for (const review of reviews) {
      try {
        // Analyze sentiment of the comment
        const analysis = sentiment.analyzeSentiment(review.comment);

        // Update review with new sentiment data
        review.sentimentScore = analysis.score;
        review.sentimentLabel = analysis.label;
        review.flaggedForReview = analysis.flagged;

        await review.save();
        updated++;

        console.log(`✅ Updated review ${updated}/${reviews.length}`);
        console.log(`   Comment: "${review.comment.substring(0, 50)}..."`);
        console.log(`   Label: ${analysis.label} | Score: ${analysis.score}\n`);
      } catch (err) {
        errors++;
        console.log(`❌ Error updating review: ${err.message}\n`);
      }
    }

    console.log(`\n=== UPDATE SUMMARY ===`);
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total reviews: ${reviews.length}`);

    // Show distribution
    const positiveReviews = await Review.countDocuments({ sentimentLabel: 'positive' });
    const neutralReviews = await Review.countDocuments({ sentimentLabel: 'neutral' });
    const negativeReviews = await Review.countDocuments({ sentimentLabel: 'negative' });

    console.log(`\n=== SENTIMENT DISTRIBUTION ===`);
    console.log(`😊 Positive: ${positiveReviews} reviews`);
    console.log(`😐 Neutral: ${neutralReviews} reviews`);
    console.log(`😞 Negative: ${negativeReviews} reviews`);

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the update
updateReviewSentiments();
