const express = require("express");
const router=express.Router()
const {protect}=require('../middleware/auth')
const employeeController=require('../controllers/employeeController')

router.use(protect)

router.post('/',employeeController.createEmployee)
router.get('/',employeeController.getEmployees)
router.delete('/:id',employeeController.deleteEmployee)


module.exports=router