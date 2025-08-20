
const express=require('express')

const router=express.Router()
const departmentController=require('../controllers/departmentController')

router.get('/',departmentController.getDepartment);
router.post('/',departmentController.addDepartment)

module.exports=router

