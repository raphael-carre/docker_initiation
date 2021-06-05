const User = require('../models/userModel')
const bcrypt = require('bcrypt')

exports.signup = async (req, res) => {
    const { username, password } = req.body
    await bcrypt.hash(password, 10)
        .then(async hashedPassword => {
            await User.create({ username, password: hashedPassword })
                .then(user => res.status(201).json({
                    status: 'success',
                    data: { user }
                }))
                .catch(error => res.status(400).json({ status: 'failed' }))
        })
        .catch(error => res.status(400).json({ status: 'failed' }))
}

exports.login = async (req, res) => {
    const { username, password } = req.body
    await User.findOne({ username })
        .then(async user => {
            if (!user) return res.status(404).json({ status: 'failed', message: 'User not found' })
            await bcrypt.compare(password, user.password)
                .then(valid => {
                    if (!valid) throw { status: 'failed', message: 'Incorrect username or password' }
                    res.status(200).json({ status: 'success' })
                })
                .catch(error => res.status(400).json(error))
        })
        .catch(error => res.status(400).json({ status: 'failed' }))
}