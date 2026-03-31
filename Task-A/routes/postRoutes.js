const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentRoutes = require('./commentRoutes');
const protect = require('../middleware/auth');

router.use('/:postId/comments', commentRoutes);

router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

router.post('/', protect, postController.createPost);
router.put('/:id', protect, postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

module.exports = router;
