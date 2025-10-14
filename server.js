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

// Check if running on Azure App Service BEFORE connecting to database
const isAzure = !!process.env.WEBSITE_INSTANCE_ID;

console.log('=== AZURE DETECTION ===');
console.log('isAzure:', isAzure);
console.log('server object type:', typeof server);
console.log('server constructor:', server.constructor.name);
console.log('=======================');

if (isAzure) {
  // On Azure: Export the Express app for iisnode (NOT the HTTP server with Socket.io)
  // iisnode will create its own HTTP server from the app
  console.log('✅ Detected Azure App Service environment');
  console.log('WEBSITE_INSTANCE_ID:', process.env.WEBSITE_INSTANCE_ID);
  console.log('Exporting Express app for iisnode (Socket.io may not work on Windows App Service)...');
  
  try {
    // Export just the Express app, let iisnode create the HTTP server
    module.exports = app;
    console.log('✅ Express app exported successfully');
    console.log('⚠️  WARNING: Socket.io will NOT work with this configuration');
    console.log('⚠️  For Socket.io support, use Linux App Service instead');
  } catch (exportError) {
    console.error('❌ Error exporting app:', exportError);
    throw exportError;
  }
  
  // Then connect to database
  mongoose.connect(process.env.DATABASE_URI)
    .then(() => {
      console.log("✅ Database connected");
      logger.info('Server initialized for Azure App Service - iisnode will handle listening');
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err);
      logger.error('Startup failed:', err);
      process.exit(1);
    });
  
} else {
  // On Local: Connect to database then listen
  console.log('Running in LOCAL mode (not Azure)');
  
  mongoose.connect(process.env.DATABASE_URI)
    .then(() => {
      console.log("Database connected");
      
      const PORT = process.env.PORT || 5000;
      
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT} with Socket.io`);
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      });

      server.on('error', (err) => {
        console.error('Server error:', err);
        logger.error('Server error:', err);
      });
    })
    .catch(err => {
      console.error('Startup failed:', err);
      logger.error('Startup failed:', err);
      process.exit(1);
    });
}