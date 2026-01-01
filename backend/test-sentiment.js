const sentiment = require('./utils/sentimentAnalysis.js');

// Test samples
const tests = [
  { text: 'She was professional, punctual, and very caring with my child. Great experience overall.', expected: 'positive', type: 'Parent → Babysitter' },
  { text: 'Amazing babysitter! My daughter absolutely loves her. Highly recommend!', expected: 'positive', type: 'Parent → Babysitter' },
  { text: 'Great parents! Very cooperative and accommodating with schedule changes.', expected: 'positive', type: 'Babysitter → Parent' },
  { text: 'Wonderful family to work with. Professional and respectful communication.', expected: 'positive', type: 'Babysitter → Parent' },
  { text: 'The babysitter arrived on time. My child played with toys.', expected: 'neutral', type: 'Parent → Babysitter' },
  { text: 'She took care of my child for the duration. Everything was normal.', expected: 'neutral', type: 'Parent → Babysitter' },
  { text: 'She was there during the scheduled time and watched my kids.', expected: 'neutral', type: 'Babysitter → Parent' },
  { text: 'Babysitter showed up and did the job. It was alright.', expected: 'neutral', type: 'Babysitter → Parent' },
  { text: 'Very disappointing experience. She was late and seemed unprofessional.', expected: 'negative', type: 'Parent → Babysitter' },
  { text: 'Terrible babysitter. Rude to my children and careless with their safety.', expected: 'negative', type: 'Parent → Babysitter' },
  { text: 'Worst babysitter ever! Late, disorganized, and dangerous with my child.', expected: 'negative', type: 'Babysitter → Parent' },
  { text: 'Disappointing - inadequate care and confusing communication.', expected: 'negative', type: 'Babysitter → Parent' }
];

console.log('=== SENTIMENT ANALYSIS TEST RESULTS ===\n');

let passed = 0;
let failed = 0;

tests.forEach((test, i) => {
  const result = sentiment.analyzeSentiment(test.text);
  const match = result.label === test.expected;
  
  if (match) {
    passed++;
    console.log(`✅ Test ${i+1}: ${test.type}`);
  } else {
    failed++;
    console.log(`❌ Test ${i+1}: ${test.type}`);
    console.log(`   Expected: ${test.expected} | Got: ${result.label}`);
  }
  
  console.log(`   Score: ${result.score} | Text: "${test.text.substring(0, 50)}..."`);
  console.log();
});

console.log(`=== SUMMARY ===`);
console.log(`✅ Passed: ${passed}/${tests.length}`);
console.log(`❌ Failed: ${failed}/${tests.length}`);
console.log(`Success Rate: ${((passed/tests.length)*100).toFixed(1)}%`);
