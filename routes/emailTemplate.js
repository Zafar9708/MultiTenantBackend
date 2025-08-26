const router=require('express').Router();
const emailTemplateController=require('../controllers/emailTemplateController')


router.post('/',emailTemplateController.createTemplate)
router.get('/',emailTemplateController.getAllTemplates)

module.exports=router