const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.getComments = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comments = await Comment.find({ post: req.params.postId }).populate('author', 'name email');
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      content: req.body.content,
      author: req.user._id,
      post: req.params.postId,
    });

    await comment.populate('author', 'name email');
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to delete this comment' });
    }

    await comment.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
