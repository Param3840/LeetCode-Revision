const express = require('express');
const router = express.Router();
const {
  syncSubmission,
  getAllSubmissions,
  getSubmissionById,
  deleteSubmission,
  toggleFavorite,
  updateRevisionStatus,
  updateNotes,
  markRevised,
  resetRevision
} = require('../controllers/submission.controller');
const { getProblemDetails } = require('../controllers/problem.controller');
const { protect } = require('../middleware/auth.middleware');

// Protect all submission routes
router.use(protect);

router.post('/', syncSubmission);
router.get('/', getAllSubmissions);
router.get('/:problemNumber/details', getProblemDetails);
router.get('/:id', getSubmissionById);
router.delete('/:id', deleteSubmission);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/revision', updateRevisionStatus);
router.patch('/:id/notes', updateNotes);
router.patch('/:id/revise', markRevised);
router.patch('/:id/reset-revision', resetRevision);

module.exports = router;
