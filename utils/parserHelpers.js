const pdfParse = require('pdf-parse');
const textract = require('textract');
const { promisify } = require('util');
const textractFromBuffer = promisify(textract.fromBufferWithName);

/**
 * Extracts name from resume text
 */
const extractName = async (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const email = extractEmail(text);
  const emailLineIndex = lines.findIndex(line => line.includes(email));
  
  let fullName = '';
  if (emailLineIndex > 0) {
    const possibleName = lines[emailLineIndex - 1].replace(/\t+/g, ' ').trim();
    const nameMatch = possibleName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
    if (nameMatch) {
      fullName = nameMatch[0];
    }
  }
  
  if (!fullName) {
    fullName = lines[0].replace(/\t+/g, ' ').trim();
  }
  
  const nameParts = fullName.split(' ');
  return {
    firstName: nameParts[0] || '',
    middleName: nameParts.length === 3 ? nameParts[1] : '',
    lastName: nameParts[nameParts.length - 1] || ''
  };
};

/**
 * Extracts email from text
 */
const extractEmail = (text) => {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  return emailMatch ? emailMatch[0] : '';
};

/**
 * Extracts phone number from text
 */
const extractPhone = (text) => {
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : '';
};

/**
 * Extracts skills from text
 */
const extractSkills = (text) => {
  const commonSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 
    'HTML', 'CSS', 'SQL', 'MongoDB', 'Express',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'REST API'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );
  
  return foundSkills;
};

/**
 * Extracts experience summary from text
 */
const extractExperience = (text) => {
  const experiencePatterns = [
    /(\d+)\s*\+?\s*(years|yrs|year)\s*of?\s*experience/i,
    /experience:\s*(\d+\s*\+?\s*(years|yrs|year))/i,
    /(\d+)\s*\+?\s*(years|yrs|year)/i
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      return `${match[1]} years of experience`;
    }
  }
  
  return '';
};

/**
 * Extracts education summary from text
 */
const extractEducation = (text) => {
  const educationPatterns = [
    /(B\.?Tech|M\.?Tech|Bachelor|Master|BSc|MSc|BE|ME|BS|MS|PhD)[^\n]*/i,
    /education[^a-z0-9]*([^\n]+)/i,
    /(university|college|institute)[^a-z0-9]*([^\n]+)/i
  ];
  
  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return '';
};

/**
 * Extracts text from file buffer (PDF or DOC/DOCX)
 */
const extractTextFromFile = async (fileBuffer, fileName) => {
  try {
    if (fileBuffer.toString('utf8', 0, 4) === '%PDF') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } else {
      return await textractFromBuffer(fileBuffer, fileName);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
};

module.exports = {
  extractName,
  extractEmail,
  extractPhone,
  extractSkills,
  extractExperience,
  extractEducation,
  extractTextFromFile
};