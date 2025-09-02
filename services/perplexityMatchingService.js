
// const axios = require('axios');
// const pdfParse = require('pdf-parse');


// console.log("Perplexity API Key:", process.env.PERPLEXITY_API_KEY ? "Loaded" : "MISSING");

// const MAX_CONTENT_LENGTH = 6000;
// const MAX_RETRIES = 3;
// const RETRY_DELAY = 1000;

// // Utility Functions ================================================

// function cleanText(text) {
//   if (!text || typeof text !== 'string') return '';
//   return text
//     .replace(/\s+/g, ' ')
//     .replace(/[^\w\s.,!?;-]/g, '')
//     .trim();
// }

// function getRecommendation(score) {
//   if (score >= 75) return "Strong Match";
//   if (score >= 50) return "Moderate Match";
//   return "Weak Match";
// }

// function validateRecommendation(value) {
//   const validRecommendations = ["Strong Match", "Moderate Match", "Weak Match"];
//   return validRecommendations.includes(value) ? value : "Weak Match";
// }

// function extractKeywords(text) {
//   if (!text) return [];
//   const commonSkills = [
//     'javascript', 'node', 'react', 'python', 'java', 'c#', '.net',
//     'sql', 'mongodb', 'express', 'aws', 'docker', 'typescript',
//     'html', 'css', 'rest', 'api', 'backend', 'frontend'
//   ];
//   return commonSkills.filter(skill => 
//     new RegExp(`\\b${skill}\\b`, 'i').test(text)
//   );
// }

// function validatePercentage(value) {
//   const num = Number(value);
//   if (isNaN(num)) return 0;
//   return Math.min(100, Math.max(0, num));
// }

// function validateSkillsArray(skills) {
//   if (!Array.isArray(skills)) return [];
//   return skills.filter(skill =>
//     skill &&
//     typeof skill.skill === 'string' &&
//     typeof skill.confidence === 'number'
//   );
// }

// function validateStringArray(items) {
//   if (!Array.isArray(items)) return [];
//   return items.filter(item => typeof item === 'string');
// }

// function normalizeConfidence(confidence) {
//   const num = Number(confidence);
//   if (isNaN(num)) return 0;
  
//   if (num > 10) return num / 100;  // If 0-100, convert to 0-1
//   if (num > 1) return num / 10;    // If 0-10, convert to 0-1
//   return Math.min(1, Math.max(0, num)); // Ensure 0-1 range
// }

// // Core Functions ===================================================

// async function extractTextFromFile(fileBuffer, fileType) {
//   try {
//     if (fileType === 'application/pdf') {
//       // Try with pdf-parse first
//       try {
//         const data = await pdfParse(fileBuffer);
//         if (data.text && data.text.trim().length > 0) {
//           return cleanText(data.text);
//         }
//       } catch (pdfParseError) {
//         console.log('pdf-parse failed, trying alternative methods');
//       }

//       // Fallback to pdf-lib for problematic PDFs
//       try {
//         const pdfDoc = await PDFDocument.load(fileBuffer);
//         const pages = pdfDoc.getPages();
//         let text = '';
//         for (const page of pages) {
//           text += await page.getTextContent();
//         }
//         if (text.trim().length > 0) {
//           return cleanText(text);
//         }
//       } catch (pdfLibError) {
//         console.log('pdf-lib extraction failed:', pdfLibError.message);
//       }

//       // Final fallback for image-based PDFs (requires OCR)
//       throw new Error('PDF appears to be image-based. Text extraction requires OCR.');
//     }
    
//     // Handle other file types (Word docs)
//     return cleanText(fileBuffer.toString('utf-8'));
//   } catch (error) {
//     console.error('Text extraction failed:', error.message);
//     throw error;
//   }
// }




// async function callPerplexityWithRetry(resumeText, jobDesc, attempt = 1) {
//   try {
//     console.log(`Attempt ${attempt} with Perplexity API`);
    
//     const prompt = `Analyze this resume against the job description and return JSON with:
// - matchPercentage (0-100)
// - matchingSkills: [{skill: string, confidence: number (0-1 scale)}]
// - missingSkills: string[]
// - recommendation: "Strong Match" | "Moderate Match" | "Weak Match"
// - analysis: string (max 300 chars)
// - experienceMatch: string (max 200 chars)
// - educationMatch: string (max 200 chars)

// Job: ${jobDesc}
// Resume: ${resumeText}

// Return ONLY valid JSON without any formatting or additional text.`;

//     const response = await axios.post(
//       'https://api.perplexity.ai/chat/completions',
//       {
//         model: "sonar-pro",
//         messages: [
//           { 
//             role: "system", 
//             content: "You are a resume analysis API. Return ONLY valid JSON with confidence values between 0 and 1." 
//           },
//           { role: "user", content: prompt }
//         ],
//         temperature: 0.3,
//         max_tokens: 1000
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
//           'Content-Type': 'application/json'
//         },
//         timeout: 20000
//       }
//     );

//     console.log('Perplexity API response received');
//     return processApiResponse(response);

//   } catch (error) {
//     console.error(`Attempt ${attempt} failed:`, error.message);
//     if (attempt < MAX_RETRIES) {
//       await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
//       return callPerplexityWithRetry(resumeText, jobDesc, attempt + 1);
//     }
//     throw error;
//   }
// }

// function processApiResponse(response) {
//   try {
//     const content = response.data.choices[0]?.message?.content;
//     if (!content) throw new Error('Empty API response');

//     const jsonMatch = content.match(/{[\s\S]*}/);
//     if (!jsonMatch) throw new Error('No JSON found in response');

//     const parsed = JSON.parse(jsonMatch[0]);
//     console.log('Raw API response:', parsed);

//     // Normalize all confidence values to 0-1 range
//     const normalizedSkills = (parsed.matchingSkills || []).map(skill => ({
//       skill: skill.skill,
//       confidence: normalizeConfidence(skill.confidence)
//     }));

//     return {
//       matchPercentage: validatePercentage(parsed.matchPercentage),
//       matchingSkills: normalizedSkills,
//       missingSkills: validateStringArray(parsed.missingSkills),
//       recommendation: validateRecommendation(parsed.recommendation),
//       analysis: (parsed.analysis || "").substring(0, 300),
//       experienceMatch: (parsed.experienceMatch || "").substring(0, 200),
//       educationMatch: (parsed.educationMatch || "").substring(0, 200)
//     };
//   } catch (error) {
//     console.error('API response processing failed:', error);
//     throw error;
//   }
// }

// function getEmptyAnalysis() {
//   return {
//     success: false,
//     extractedData: {
//       skills: [],
//       experience: '',
//       education: ''
//     },
//     aiAnalysis: {
//       matchPercentage: 0,
//       matchingSkills: [],
//       missingSkills: [],
//       recommendation: "Weak Match",
//       analysis: "Analysis failed",
//       experienceMatch: "",
//       educationMatch: "",
//       parsedAt: new Date()
//     }
//   };
// }

// function getBasicAnalysis(resumeText = '', jobDescription = '') {
//   try {
//     if (!resumeText) throw new Error('No resume text provided');

//     const jobKeywords = extractKeywords(jobDescription);
//     const resumeKeywords = extractKeywords(resumeText);

//     const matchingSkills = jobKeywords
//       .filter(skill => resumeKeywords.includes(skill))
//       .map(skill => ({ 
//         skill, 
//         confidence: 0.8 // Using 0-1 range
//       }));

//     const missingSkills = jobKeywords.filter(skill => !resumeKeywords.includes(skill));

//     const matchPercentage = Math.floor(
//       (matchingSkills.length / Math.max(jobKeywords.length, 1)) * 100
//     );

//     return {
//       success: false,
//       extractedData: {
//         skills: resumeKeywords,
//         experience: '',
//         education: ''
//       },
//       aiAnalysis: {
//         matchPercentage,
//         matchingSkills,
//         missingSkills,
//         recommendation: getRecommendation(matchPercentage),
//         analysis: "Basic keyword matching completed",
//         experienceMatch: "",
//         educationMatch: "",
//         parsedAt: new Date()
//       }
//     };
//   } catch (error) {
//     console.error('Basic analysis failed:', error);
//     return getEmptyAnalysis();
//   }
// }

// // Main Export ======================================================



// async function analyzeResumeWithPerplexity(resumeBuffer, jobDescription = '') {
//   console.log('=== Starting Analysis ===');
//   console.log('Job Description Length:', jobDescription?.length || 0);

//   try {
//     // Validate inputs
//     if (!resumeBuffer || !Buffer.isBuffer(resumeBuffer)) {
//       console.error('Invalid resume buffer');
//       return getBasicAnalysis('', jobDescription);
//     }

//     // Extract text
//     let resumeText;
//     try {
//       resumeText = await extractTextFromFile(resumeBuffer, 'application/pdf');
//       console.log('Extracted Resume Text Length:', resumeText.length);
//       console.log('Sample Text:', resumeText.substring(0, 100) + '...');
//     } catch (extractError) {
//       console.error('Text extraction failed:', extractError);
//       return getBasicAnalysis('', jobDescription);
//     }

//     // Get analysis
//     try {
//       const cleanJobDesc = cleanText(jobDescription || '').substring(0, 2000);
//       const cleanResume = cleanText(resumeText).substring(0, 4000);

//       console.log('Sending to analysis service...');
//       const analysis = await callPerplexityWithRetry(cleanResume, cleanJobDesc);
      
//       console.log('Analysis completed successfully');
//       return {
//         success: true,
//         extractedData: {
//           skills: analysis.matchingSkills.map(s => s.skill),
//           experience: analysis.experienceMatch,
//           education: analysis.educationMatch
//         },
//         aiAnalysis: {
//           ...analysis,
//           parsedAt: new Date()
//         }
//       };
//     } catch (apiError) {
//       console.error('Perplexity API failed, using basic analysis:', apiError.message);
//       return getBasicAnalysis(resumeText, jobDescription);
//     }
//   } catch (error) {
//     console.error('Analysis failed:', error.message);
//     return getEmptyAnalysis();
//   }
// }

// module.exports = {
//   analyzeResumeWithPerplexity
// };

//---------

const axios = require('axios');
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');

console.log("Perplexity API Key:", process.env.PERPLEXITY_API_KEY ? "Loaded" : "MISSING");

const MAX_CONTENT_LENGTH = 6000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Utility Functions ================================================

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;-@]/g, '')
    .trim();
}

function extractPersonalDetails(text) {
  const details = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) details.email = emailMatch[0];

  // Extract phone (international formats)
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  if (phoneMatch) details.phone = phoneMatch[0];

  // Extract name (look for common patterns)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Try to find name in first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    const words = line.split(/\s+/).filter(word => word.length > 1);
    
    // Look for lines that might contain a name (not emails, phones, URLs)
    if (words.length >= 2 && 
        !line.includes('@') && 
        !line.match(/\d{10}/) && 
        !line.includes('http')) {
      details.firstName = words[0];
      details.lastName = words.slice(1).join(' ');
      break;
    }
  }

  return details;
}

function getRecommendation(score) {
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Moderate Match";
  return "Weak Match";
}

function validatePercentage(value) {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.min(100, Math.max(0, num));
}

function validateSkillsArray(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.filter(skill =>
    skill &&
    typeof skill.skill === 'string' &&
    typeof skill.confidence === 'number'
  );
}

function validateStringArray(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(item => typeof item === 'string');
}

function normalizeConfidence(confidence) {
  const num = Number(confidence);
  if (isNaN(num)) return 0;
  return Math.min(1, Math.max(0, num));
}

// Core Functions ===================================================

async function extractTextFromFile(fileBuffer, fileType) {
  try {
    if (fileType === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      if (data.text && data.text.trim().length > 0) {
        return cleanText(data.text);
      }
      throw new Error('No text extracted from PDF');
    }
    
    // Handle other file types (Word docs)
    return cleanText(fileBuffer.toString('utf-8'));
  } catch (error) {
    console.error('Text extraction failed:', error.message);
    throw error;
  }
}

async function callPerplexityWithRetry(resumeText, jobDesc, attempt = 1) {
  try {
    console.log(`Attempt ${attempt} with Perplexity API`);
    
    const prompt = `Extract personal information from this resume text and analyze it against the job description. Return ONLY valid JSON with:
- firstName (string)
- lastName (string) 
- email (string)
- phone (string)
- matchPercentage (0-100)
- matchingSkills: [{skill: string, confidence: number (0-1 scale)}]
- missingSkills: string[]
- recommendation: "Strong Match" | "Moderate Match" | "Weak Match"
- analysis: string (max 300 chars)
- experienceMatch: string (max 200 chars)
- educationMatch: string (max 200 chars)

Job Description: ${jobDesc}
Resume Text: ${resumeText}

Return ONLY valid JSON without any formatting or additional text.`;

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: "sonar-pro",
        messages: [
          { 
            role: "system", 
            content: "You are a resume analysis API. Extract personal information and analyze the resume. Return ONLY valid JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    console.log('Perplexity API response received');
    return processApiResponse(response);

  } catch (error) {
    console.error(`Attempt ${attempt} failed:`, error.message);
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      return callPerplexityWithRetry(resumeText, jobDesc, attempt + 1);
    }
    throw error;
  }
}

function processApiResponse(response) {
  try {
    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('Empty API response');

    const jsonMatch = content.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Raw API response:', parsed);

    // Extract personal details
    const personalDetails = {
      firstName: parsed.firstName || '',
      lastName: parsed.lastName || '',
      email: parsed.email || '',
      phone: parsed.phone || ''
    };

    // Normalize all confidence values to 0-1 range
    const normalizedSkills = (parsed.matchingSkills || []).map(skill => ({
      skill: skill.skill,
      confidence: normalizeConfidence(skill.confidence)
    }));

    return {
      personalDetails,
      matchPercentage: validatePercentage(parsed.matchPercentage),
      matchingSkills: normalizedSkills,
      missingSkills: validateStringArray(parsed.missingSkills),
      recommendation: parsed.recommendation || "Weak Match",
      analysis: (parsed.analysis || "").substring(0, 300),
      experienceMatch: (parsed.experienceMatch || "").substring(0, 200),
      educationMatch: (parsed.educationMatch || "").substring(0, 200)
    };
  } catch (error) {
    console.error('API response processing failed:', error);
    throw error;
  }
}

async function analyzeResumeWithPerplexity(resumeBuffer, jobDescription = '') {
  console.log('=== Starting Analysis ===');
  
  try {
    // Extract text
    const resumeText = await extractTextFromFile(resumeBuffer, 'application/pdf');
    console.log('Extracted Resume Text Length:', resumeText.length);
    console.log('Sample Text:', resumeText.substring(0, 100) + '...');

    // First, try basic extraction from text
    const basicDetails = extractPersonalDetails(resumeText);
    console.log('Basic extracted details:', basicDetails);

    // Then call Perplexity for advanced analysis
    const cleanJobDesc = cleanText(jobDescription || '').substring(0, 2000);
    const cleanResume = cleanText(resumeText).substring(0, 4000);

    console.log('Sending to Perplexity API...');
    const analysis = await callPerplexityWithRetry(cleanResume, cleanJobDesc);
    
    console.log('Analysis completed successfully');
    
    // Combine basic extraction with AI analysis
    return {
      success: true,
      extractedData: {
        firstName: analysis.personalDetails.firstName || basicDetails.firstName,
        lastName: analysis.personalDetails.lastName || basicDetails.lastName,
        email: analysis.personalDetails.email || basicDetails.email,
        phone: analysis.personalDetails.phone || basicDetails.phone,
        skills: analysis.matchingSkills.map(s => s.skill),
        experience: analysis.experienceMatch,
        education: analysis.educationMatch
      },
      aiAnalysis: {
        matchPercentage: analysis.matchPercentage,
        matchingSkills: analysis.matchingSkills,
        missingSkills: analysis.missingSkills,
        recommendation: analysis.recommendation,
        analysis: analysis.analysis,
        experienceMatch: analysis.experienceMatch,
        educationMatch: analysis.educationMatch,
        parsedAt: new Date()
      }
    };
  } catch (error) {
    console.error('Analysis failed:', error.message);
    
    // Fallback: basic extraction only
    try {
      const resumeText = await extractTextFromFile(resumeBuffer, 'application/pdf');
      const basicDetails = extractPersonalDetails(resumeText);
      
      return {
        success: true,
        extractedData: {
          ...basicDetails,
          skills: [],
          experience: '',
          education: ''
        },
        aiAnalysis: {
          matchPercentage: 0,
          matchingSkills: [],
          missingSkills: [],
          recommendation: "Basic extraction only",
          analysis: "Text extracted but not fully analyzed",
          parsedAt: new Date()
        }
      };
    } catch (fallbackError) {
      console.error('Fallback extraction failed:', fallbackError.message);
      throw error;
    }
  }
}

module.exports = {
  analyzeResumeWithPerplexity
};