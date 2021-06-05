const express = require('express')
const mongoose = require('mongoose')
const { MONGO_USER, MONGO_PASSWORD, MONGO_IP, MONGO_PORT } = require('./config/config')
const postRouter = require('./routes/postRoutes')
const userRouter = require('./routes/userRoutes')

const bookSchema = mongoose.Schema({
    name: { type: String, required: true }
})

const bookModel = mongoose.model('Book', bookSchema)

const app = express()

const port = process.env.PORT || 3000

const mongoUrl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/mydb?authSource=admin`

const connectWithRetry = () => {
    mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
        .then(() => console.log('Successfully connected to database'))
        .catch(error => {
            console.log('Connection failed !', error)
            setTimeout(connectWithRetry, 5000)
        })
}

connectWithRetry()

app.use(express.json())

app.use('/api/v1/posts', postRouter)
app.use('/api/v1/users', userRouter)

app.get('/', (req, res) => {
    bookModel.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(404).json({ error }))
    
})


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})