const express = require('express');
const router = express.Router();
const {protect}=require('../middleware/auth')

const notesController=require('../controllers/notesController')

router.use(protect)

router.post('/:jobId',  notesController.createNote);      
router.get('/:jobId',  notesController.getNotesByJob);    
router.delete('/:noteId', notesController.deleteNote); 
router.put('/:noteId',notesController.updateNote);

module.exports = router;
