import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import process from 'process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const app = express()

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://ecom-group-frontend.onrender.com'
]

const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const corsOrigins = allowedOrigins.length ? allowedOrigins : defaultCorsOrigins

app.use(cors({
  origin(origin, callback){
    // Allow non-browser tools (curl/postman) which send no Origin
    if (!origin) return callback(null, true)
    if (corsOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// serve uploaded files (determine path relative to this file)
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
