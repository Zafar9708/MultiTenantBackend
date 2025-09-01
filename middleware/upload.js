const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel', // Excel .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
    'application/vnd.ms-excel.sheet.macroEnabled.12', // Excel .xlsm
    'application/vnd.ms-excel.template.macroEnabled.12' // Excel .xltm
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.xlsm', '.xltm'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT ,and Excel files are allowed'), false);
  }
};

// Configure upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const excelUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const excelMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.template.macroEnabled.12'
    ];
    
    const excelExtensions = ['.xls', '.xlsx', '.xlsm', '.xltm'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (excelMimeTypes.includes(file.mimetype) || excelExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for Excel files
  }
});

module.exports = {
  upload,
  excelUpload
}