const templates = require('../data/templates.json');
const AppError = require('../utils/appError');


exports.getJobTemplates=async(req,res,next)=>{
     try {
    res.status(200).json(templates);
  } catch (error) {
    return next(new AppError('Error fetching in job templates',500));
  }
}