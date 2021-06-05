const Post = require('../models/postModel')

exports.getAllPosts = async (req, res) => {
    await Post.find()
        .then(posts => res.status(200).json({
            status: 'success',
            results: posts.length,
            data: { posts }
        }))
        .catch(error => res.status(400).json({ status: 'failed' }))
}

exports.getOnePost = async (req, res) => {
    await Post.findById(req.params.id)
        .then(post => res.status(200).json({
            status: 'success',
            data: { post }
        }))
        .catch(error => res.status(400).json({ status: 'failed' }))
}

exports.createPost = async (req, res) => {
    await Post.create(req.body)
        .then(post => res.status(201).json({
            status: 'success',
            data: { post }
        }))
        .catch(error => res.status(400).json({ status: 'failed' }))
}

exports.updatePost = async (req, res) => {
    await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true})
        .then(post => res.status(200).json({
            status: 'success',
            data: { post }
        }))
        .catch(error => res.status(400).json({ status: 'failed' }))
}

exports.deletePost = async (req, res) => {
    await Post.findByIdAndDelete(req.params.id)
        .then(post => res.status(200).json({ status: 'success' }))
        .catch(error => res.status(400).json({ status: 'failed' }))
}