const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
dotenv.config({ path: './config.env' });
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const taskRoutes = require('./routes/taskRoutes');
const jobRoutes=require('./routes/jobRoutes')
const locationRoutes=require('./routes/locationRoutes')
const employeeRoutes=require('./routes/employeeRoutes')
const adminRoutes=require('./routes/adminRoutes')
const departmentsRoutes=require('./routes/departmentsRoutes')
const templatesRoutes=require('./routes/jobTemplates')
const jobOptionsRoutes=require('./routes/jobOptionsRoutes')
const clientRoutes=require('./routes/clientRoutes')
const notesRoutes=require('./routes/notesRoutes')
const sourceRoutes=require('./routes/sourceRoutes')
const stagesRoutes=require('./routes/stagesRoutes')
const candidateRoutes=require('./routes/candidateRoutes')
const candidateNotesRoutes = require('./routes/candidateNotesRoutes');
const interviewerRoutes = require('./routes/interviewerRoutes');
const emailTemplateRoutes = require('./routes/emailTemplate');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();
app.use(cors());

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

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/admin',adminRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/job',jobRoutes);
app.use('/api/v1/location',locationRoutes);
app.use('/api/v1/employees',employeeRoutes);
app.use('/api/v1/departments',departmentsRoutes);
app.use('/api/v1/templates',templatesRoutes);
app.use('/api/v1/options',jobOptionsRoutes);
app.use('/api/v1/clients',clientRoutes);
app.use('/api/v1/notes',notesRoutes);
app.use('/api/v1/source',sourceRoutes);
app.use('/api/v1/stages',stagesRoutes);
app.use('/api/v1/candidates',candidateRoutes)
app.use('/api/v1/candidatesnotes',candidateNotesRoutes)
app.use('/api/v1/interviewers',interviewerRoutes)
app.use('/api/v1/email-templates',emailTemplateRoutes);
app.use('/api/v1/interviews',interviewRoutes)



app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

//for google refresh tokens 
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

module.exports = app;