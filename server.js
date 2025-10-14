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
console.log("ENV Variables:", {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URI: process.env.DATABASE_URI ? "******" : "MISSING"
});

app.get('/', (req, res) => {
  res.send('Hello, Node.js Server is Working with Socket.io!');
});

// Check if running on Azure App Service BEFORE connecting to database
const isAzure = !!process.env.WEBSITE_INSTANCE_ID;

if (isAzure) {
  // On Azure: Export immediately for iisnode, then connect to database
  console.log('Detected Azure App Service environment');
  console.log('WEBSITE_INSTANCE_ID:', process.env.WEBSITE_INSTANCE_ID);
  
  mongoose.connect(process.env.DATABASE_URI)
    .then(() => {
      console.log("Database connected");
      logger.info('Server initialized for Azure App Service - iisnode will handle listening');
    })
    .catch(err => {
      console.error('Startup failed:', err);
      logger.error('Startup failed:', err);
      process.exit(1);
    });
  
  // Export the server for iisnode to use
  module.exports = server;
} else {
  // On Local: Connect to database then listen
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