
const express=require('express')
const router=express.Router()
const jobOptionsController=require('../controllers/jobOptionsController')

router.get('/',jobOptionsController.getOptions)

module.exports=router