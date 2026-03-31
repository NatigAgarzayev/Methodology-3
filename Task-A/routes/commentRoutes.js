const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const protect = require('../middleware/auth');

router.get('/', commentController.getComments);
router.post('/', protect, commentController.createComment);
router.delete('/:commentId', protect, commentController.deleteComment);

module.exports = router;
