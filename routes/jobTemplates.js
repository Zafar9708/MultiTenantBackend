const express=require('express')
const router=express.Router()
const fetchJobTemplates=require('../controllers/templateController')


router.get('/',fetchJobTemplates.getJobTemplates)

module.exports=router

