import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import process from 'process'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// serve uploaded files (determine path relative to this file)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsPath = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsPath))

const PORT = process.env.PORT || 5000

import productsRoute from './routes/products.js'
import usersRoute from './routes/users.js'
import ordersRoute from './routes/orders.js'
import authRoute from './routes/auth.js'


connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/jute_ecommerce')

app.use('/api/products', productsRoute)
app.use('/api/users', usersRoute)
app.use('/api/orders', ordersRoute)
app.use('/api/auth', authRoute)

app.get('/', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, ()=> console.log('Server running on port', PORT))
