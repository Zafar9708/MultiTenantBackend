// require('dotenv').config({ path: '.env', debug: true });
// const logger = require('./services/logger');
// const app = require('./app');
// const mongoose = require('mongoose');

// console.log("Server.js is starting...");
// console.log("ENV Variables:", {
//   PORT: process.env.PORT,
//   NODE_ENV: process.env.NODE_ENV,
//   DATABASE_URI: process.env.DATABASE_URI ? "******" : "MISSING"
// });

// app.get('/',(req,res)=>{
//   res.send('Hello ,Node Js Server is Working')
// })

// mongoose.connect(process.env.DATABASE_URI)
//   .then(() => {
//     console.log("Database connected");
    
//     const PORT = process.env.PORT || 5000;
//     const server = app.listen(PORT,'0.0.0.0', () => {
//       console.log(`Server running on port ${PORT}`);
//       logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
//     });

//     server.on('error', (err) => {
//       console.error('Server error:', err);
//       logger.error('Server error:', err);
//     });
//   })
//   .catch(err => {
//     console.error('Startup failed:', err);
//     logger.error('Startup failed:', err);
//     process.exit(1);
//   });


require('dotenv').config({ path: '.env', debug: true });
const logger = require('./services/logger');
const { app, server } = require('./app'); // Import both app and server
const mongoose = require('mongoose');

console.log("Server.js is starting...");
console.log('Environment check:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('WEBSITE_INSTANCE_ID:', process.env.WEBSITE_INSTANCE_ID || 'NOT SET (running locally)');
console.log("ENV Variables:", {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URI: process.env.DATABASE_URI ? "******" : "MISSING",
  IS_AZURE: !!process.env.WEBSITE_INSTANCE_ID
});

// Simple test endpoint
app.get('/', (req, res) => {
  res.send('Hello, Node.js Server is Working with Socket.io!');
});

// iisnode health check
app.get('/iisnode', (req, res) => {
  res.json({
    status: 'OK',
    message: 'iisnode is communicating with Node.js',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WEBSITE_INSTANCE_ID: process.env.WEBSITE_INSTANCE_ID ? 'SET' : 'NOT SET'
    }
  });
});

// Connect to database first
mongoose.connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("✅ Database connected");
    logger.info('Database connection successful');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    logger.error('Startup failed:', err);
    process.exit(1);
  });

// Determine port - use process.env.PORT if set (Azure sets this), otherwise 5000
const PORT = process.env.PORT || 5000;

// Check if we should start listening (not on iisnode/Azure with named pipes)
// iisnode uses named pipes, not actual port numbers
if (require.main === module) {
  // This file is being run directly (not imported by iisnode)
  console.log(`🚀 Starting server on port ${PORT}...`);
  
  server.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT} with Socket.io`);
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    logger.error('Server error:', err);
    process.exit(1);
  });
} else {
  // This file is being imported as a module (by iisnode)
  console.log('📦 Server.js loaded as module (iisnode will handle listening)');
  logger.info('Module loaded for iisnode - server initialization delegated to IIS');
}

// Export app for iisnode
// iisnode will create its own HTTP server from this Express app
module.exports = app;