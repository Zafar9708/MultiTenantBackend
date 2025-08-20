const express=require('express')
const router=express.Router()
const clientController=require('../controllers/clientController')


router.post('/',clientController.addClient);
router.get('/',clientController.getClients);
router.delete('/:id',clientController.deleteClient );

module.exports = router;


