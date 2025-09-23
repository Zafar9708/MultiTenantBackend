// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const morgan = require('morgan');
// const cors = require('cors');
// dotenv.config({ path: './config.env' });
// const authRoutes = require('./routes/authRoutes');
// const tenantRoutes = require('./routes/tenantRoutes');
// const taskRoutes = require('./routes/taskRoutes');
// const jobRoutes=require('./routes/jobRoutes')
// const locationRoutes=require('./routes/locationRoutes')
// const employeeRoutes=require('./routes/employeeRoutes')
// const adminRoutes=require('./routes/adminRoutes')
// const departmentsRoutes=require('./routes/departmentsRoutes')
// const templatesRoutes=require('./routes/jobTemplates')
// const jobOptionsRoutes=require('./routes/jobOptionsRoutes')
// const clientRoutes=require('./routes/clientRoutes')
// const notesRoutes=require('./routes/notesRoutes')
// const sourceRoutes=require('./routes/sourceRoutes')
// const stagesRoutes=require('./routes/stagesRoutes')
// const candidateRoutes=require('./routes/candidateRoutes')
// const candidateNotesRoutes = require('./routes/candidateNotesRoutes');
// const interviewerRoutes = require('./routes/interviewerRoutes');
// const emailTemplateRoutes = require('./routes/emailTemplate');
// const interviewRoutes = require('./routes/interviewRoutes');
// const chatBoatRoutes = require('./routes/chatBoatRoutes');
// const offlineInterviewRoutes=require('./routes/offlineRoutes')
// const vendorRoutes=require('./routes/vendorRoutes')
// const jobStatusRoutes=require('./routes/jobStatusRoutes')

// const app = express();
// app.use(cors());

// app.use(express.json());
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// mongoose
//   .connect(process.env.DATABASE_URI)
//   .then(() => console.log('DB connection successful'))
//   .catch(err => console.error('DB connection error:', err));



// app.use((req, res, next) => {
//   console.log(`Incoming ${req.method} ${req.path}`);
//   next();
// });

// // app.use(cors({
// //   origin: 'http://localhost:5173', 
// //   credentials: true
// // }));

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",   // local frontend
//       "https://wrocusats.vercel.app", // deployed frontend
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/tenants', tenantRoutes);
// app.use('/api/v1/admin',adminRoutes);
// app.use('/api/v1/tasks', taskRoutes);
// app.use('/api/v1/job',jobRoutes);
// app.use('/api/v1/location',locationRoutes);
// app.use('/api/v1/employees',employeeRoutes);
// app.use('/api/v1/departments',departmentsRoutes);
// app.use('/api/v1/templates',templatesRoutes);
// app.use('/api/v1/options',jobOptionsRoutes);
// app.use('/api/v1/clients',clientRoutes);
// app.use('/api/v1/notes',notesRoutes);
// app.use('/api/v1/source',sourceRoutes);
// app.use('/api/v1/stages',stagesRoutes);
// app.use('/api/v1/candidates',candidateRoutes)
// app.use('/api/v1/candidatesnotes',candidateNotesRoutes)
// app.use('/api/v1/interviewers',interviewerRoutes)
// app.use('/api/v1/email-templates',emailTemplateRoutes);
// app.use('/api/v1/interviews',interviewRoutes);
// app.use('/api/v1/offline/interviews',offlineInterviewRoutes);
// app.use('/api/v1/chatboat',chatBoatRoutes);
// app.use('/api/v1/vendor',vendorRoutes);
// app.use('/api/v1/jobStatus',jobStatusRoutes)




// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
// });

// //for google refresh tokens 
// app.get('/auth/google/callback', async (req, res) => {
//   const code = req.query.code;

//   if (!code) return res.status(400).send('No code provided.');

//   try {
//     const tokenResponse = await axios.post(
//       'https://oauth2.googleapis.com/token',
//       new URLSearchParams({
//         code,
//         client_id: process.env.GOOGLE_CLIENT_ID,
//         client_secret: process.env.GOOGLE_CLIENT_SECRET,
//         redirect_uri: process.env.GOOGLE_REDIRECT_URI,
//         grant_type: 'authorization_code',
//       }),
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       }
//     );

//     const tokens = tokenResponse.data;
//     console.log('Tokens:', tokens);

//     res.send(`<pre>Tokens received:\n${JSON.stringify(tokens, null, 2)}</pre>`);
//   } catch (error) {
//     console.error('Token exchange failed:', error.response?.data || error.message);
//     res.status(500).send('Failed to exchange code for tokens.');
//   }
// });

// module.exports = app;


const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken'); // Add this at the top


dotenv.config({ path: './config.env' });
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const taskRoutes = require('./routes/taskRoutes');
const jobRoutes = require('./routes/jobRoutes');
const locationRoutes = require('./routes/locationRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentsRoutes = require('./routes/departmentsRoutes');
const templatesRoutes = require('./routes/jobTemplates');
const jobOptionsRoutes = require('./routes/jobOptionsRoutes');
const clientRoutes = require('./routes/clientRoutes');
const notesRoutes = require('./routes/notesRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const stagesRoutes = require('./routes/stagesRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const candidateNotesRoutes = require('./routes/candidateNotesRoutes');
const interviewerRoutes = require('./routes/interviewerRoutes');
const emailTemplateRoutes = require('./routes/emailTemplate');
const interviewRoutes = require('./routes/interviewRoutes');
const chatBoatRoutes = require('./routes/chatBoatRoutes');
const offlineInterviewRoutes = require('./routes/offlineRoutes');
// const vendorRoutes = require('./routes/vendorRoutes');
const jobStatusRoutes = require('./routes/jobStatusRoutes');
const vendorRoutes=require('./routes/vendorRoutes')

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://wrocusats.vercel.app",
       "http://localhost:5000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users by tenant
const connectedUsers = new Map();
// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Connection details:', {
    headers: socket.handshake.headers,
    auth: socket.handshake.auth,
    query: socket.handshake.query
  });

  // Handle authentication via query parameter
  const token = socket.handshake.query.token || socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.tenantId = decoded.tenantId;
      console.log(`Authenticated user: ${decoded.id}, tenant: ${decoded.tenantId}`);
      
      // Automatically join tenant room after authentication
      socket.join(decoded.tenantId);
      connectedUsers.set(socket.id, { 
        tenantId: decoded.tenantId, 
        userId: decoded.id,
        socketId: socket.id 
      });
      console.log(`Socket ${socket.id} joined tenant room: ${decoded.tenantId}`);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't disconnect immediately, allow join-tenant event
    }
  }

  // Handle user joining their tenant room (for cases without token)
  socket.on('join-tenant', (tenantId) => {
    console.log(`Socket ${socket.id} joining tenant: ${tenantId}`);
    socket.join(tenantId);
    connectedUsers.set(socket.id, { tenantId, socketId: socket.id });
    console.log(`Socket ${socket.id} joined tenant room: ${tenantId}`);
    
    // Send welcome message
    socket.emit('welcome', {
      message: `Connected to tenant ${tenantId}`,
      socketId: socket.id,
      time: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    connectedUsers.delete(socket.id);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io available to other modules
app.set('io', io);

app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => console.log('DB connection successful'))
  .catch(err => console.error('DB connection error:', err));

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://wrocusats.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentsRoutes);
app.use('/api/v1/templates', templatesRoutes);
app.use('/api/v1/options', jobOptionsRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/notes', notesRoutes);
app.use('/api/v1/source', sourceRoutes);
app.use('/api/v1/stages', stagesRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/candidatesnotes', candidateNotesRoutes);
app.use('/api/v1/interviewers', interviewerRoutes);
app.use('/api/v1/email-templates', emailTemplateRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/offline/interviews', offlineInterviewRoutes);
app.use('/api/v1/chatboat', chatBoatRoutes);
// app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/jobStatus', jobStatusRoutes);
app.use('/api/v1/vendor', vendorRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

// For google refresh tokens 
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send('No code provided.');

  try {
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens = tokenResponse.data;
    console.log('Tokens:', tokens);

    res.send(`<pre>Tokens received:\n${JSON.stringify(tokens, null, 2)}</pre>`);
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.status(500).send('Failed to exchange code for tokens.');
  }
});

// Test Socket.io route
// Test Socket.io connection
app.get('/api/test-socket', (req, res) => {
  const io = req.app.get('io');
  if (io) {
    const tenantId = req.query.tenantId;
    const clientsCount = io.engine.clientsCount;
    const connectedClients = Array.from(io.sockets.sockets.values()).map(socket => ({
      id: socket.id,
      rooms: Array.from(socket.rooms),
      tenantId: socket.tenantId
    }));
    
    console.log('Connected clients:', connectedClients);
    
    // Send to all connected clients
    io.emit('test-event', { 
      message: 'Test message from server', 
      time: new Date().toISOString(),
      totalClients: clientsCount
    });
    
    // Send to specific tenant if provided
    if (tenantId) {
      io.to(tenantId).emit('test-tenant', {
        message: `Test message for tenant ${tenantId}`,
        time: new Date().toISOString(),
        targetTenant: tenantId
      });
      console.log(`Sent test message to tenant: ${tenantId}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Test events emitted',
      totalClients: clientsCount,
      connectedClients: connectedClients
    });
  } else {
    res.json({ success: false, message: 'Socket.io not available' });
  }
});

// Debug endpoint to check Socket.io status
app.get('/api/debug/socket-status', (req, res) => {
  const io = req.app.get('io');
  if (io) {
    const rooms = Array.from(io.sockets.adapter.rooms).map(([roomId, sockets]) => ({
      roomId,
      clientCount: sockets.size,
      isTenantRoom: roomId.length === 24 // MongoDB ID length
    }));
    
    res.json({
      success: true,
      totalClients: io.engine.clientsCount,
      rooms: rooms,
      serverTime: new Date().toISOString()
    });
  } else {
    res.json({ success: false, message: 'Socket.io not available' });
  }
});


// Export both app and server
module.exports = { app, server };