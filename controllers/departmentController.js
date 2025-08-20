

// const express = require('express');
// const router = express.Router();
// const { getDepartments, addDepartment } = require('../utils/departments');

// router.get('/', (req, res) => {
//   console.log("GET /api/departments called");
//   res.status(200).json(getDepartments());
// });

// router.post('/', (req, res) => {

//   const { name } = req.body;
//   if (!name) {
//     return res.status(400).json({ message: 'Department name is required' });
//   }

//   const updatedList = addDepartment(name);
//   return res.status(201).json({ message: 'Department added', departments: updatedList });
// });


// module.exports = router;

const express=require('express')
const { getDepartments, addDepartment } = require('../utils/departments');
const AppError = require('../utils/appError');


exports.getDepartment=async(req,res)=>{
     res.status(200).json(getDepartments());
}

exports.addDepartment=async(req,res,next)=>{
    const { name } = req.body;
    if (!name) {
     return next(new AppError("Department name is required"))
  }
  const updatedList = addDepartment(name);
  return res.status(201).json({ message: 'Department added', departments: updatedList });
};


