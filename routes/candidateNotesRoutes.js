const router = require('express').Router();
const noteController = require('../controllers/candidateNoteController');

router.post('/', noteController.addCandidateNote); 

router.get('/candidate/:candidateId', noteController.getCandidateNotesByCandidateId); 

router.put('/:id', noteController.updateCandidateNote);

router.delete('/:id', noteController.deleteCandidateNote);

module.exports = router;