const express = require('express');
const router = express.Router();
const natural = require('natural');
const { NlpManager } = require('node-nlp');

// Initialize NLP manager
const manager = new NlpManager({ languages: ['en'] });

// Train the NLP model with ATS-specific data
const trainModel = async () => {
  // Application status queries
  manager.addDocument('en', 'application status', 'application.status');
  manager.addDocument('en', 'check my application', 'application.status');
  manager.addDocument('en', 'where is my application', 'application.status');
  manager.addDocument('en', 'how is my application progressing', 'application.status');
  manager.addDocument('en', 'status of my job application', 'application.status');
  
  // Job openings queries
  manager.addDocument('en', 'job openings', 'job.openings');
  manager.addDocument('en', 'available positions', 'job.openings');
  manager.addDocument('en', 'what jobs are available', 'job.openings');
  manager.addDocument('en', 'open positions', 'job.openings');
  manager.addDocument('en', 'career opportunities', 'job.openings');
  
  // Profile update queries
  manager.addDocument('en', 'update profile', 'profile.update');
  manager.addDocument('en', 'change my information', 'profile.update');
  manager.addDocument('en', 'edit my details', 'profile.update');
  manager.addDocument('en', 'modify my application', 'profile.update');
  manager.addDocument('en', 'change contact info', 'profile.update');
  
  // Interview queries
  manager.addDocument('en', 'interview schedule', 'interview.schedule');
  manager.addDocument('en', 'when is my interview', 'interview.schedule');
  manager.addDocument('en', 'interview timing', 'interview.schedule');
  manager.addDocument('en', 'interview details', 'interview.schedule');
  manager.addDocument('en', 'reschedule interview', 'interview.reschedule');
  
  // Technical support queries
  manager.addDocument('en', 'help', 'support.help');
  manager.addDocument('en', 'I need help', 'support.help');
  manager.addDocument('en', 'support', 'support.help');
  manager.addDocument('en', 'technical issue', 'support.technical');
  manager.addDocument('en', 'not working', 'support.technical');
  
  // Add answers
  manager.addAnswer('en', 'application.status', 'To check your application status, please provide your application ID or email address. You can also visit the "Application Status" section in your dashboard.');
  manager.addAnswer('en', 'job.openings', 'You can view all available positions in the "Careers" section of our website. Would you like me to show you current openings?');
  manager.addAnswer('en', 'profile.update', 'You can update your profile information by logging into your candidate portal and navigating to "Profile Settings".');
  manager.addAnswer('en', 'interview.schedule', 'Your interview details will be emailed to you. Please check your inbox and spam folder. You can also view scheduled interviews in your dashboard.');
  manager.addAnswer('en', 'interview.reschedule', 'To reschedule your interview, please contact our HR department at hr@yourcompany.com or call (555) 123-4567.');
  manager.addAnswer('en', 'support.help', 'I can help you with application status, job openings, profile updates, and interview information. What do you need help with?');
  manager.addAnswer('en', 'support.technical', 'For technical issues, please contact our support team at support@yourcompany.com or call (555) 987-6543. They are available Monday-Friday, 9AM-5PM.');
  
  // Train and save the model
  await manager.train();
  manager.save();
};

trainModel();

// Chatbot API endpoint
router.post('/chat', async (req, res) => {
  const { message, userId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    const response = await manager.process('en', message);
    
    // Here you can add logic to fetch real data from your database
    // based on the intent and userId
    let reply = response.answer || "I'm not sure how to help with that. Please contact our support team for assistance.";
    
    // Customize response based on intent (you can expand this)
    if (response.intent === 'application.status' && userId) {
      // In a real scenario, you would fetch actual application status from DB
      reply = `Based on your user profile, your application is currently in review. You'll be notified once there's an update.`;
    }
    
    res.json({ 
      reply,
      intent: response.intent
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;