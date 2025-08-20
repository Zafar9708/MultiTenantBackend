
const express=require('express')
const jobTypes = require('../utils/jobTypes');
const currencies=require('../utils/currencies')
const locations=require('../utils/location')

exports.getOptions=async(req,res,next)=>{
    res.json({
    jobTypes,
    locations,
    currencies
  });
}