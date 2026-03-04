import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
const router = express.Router()

import Product from '../models/Product.js'
import User from '../models/User.js'

const requireNotBlockedProducer = async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'producer') return null

  const userId = String(req.headers['x-user-id'] || '').trim()
  if (!userId) {
    return res.status(400).json({ message: 'X-User-Id header is required' })
  }

  const user = await User.findById(userId).select('blocked role')
  if (!user) {
    return res.status(401).json({ message: 'User not found' })
  }
  if (user.blocked) {
    return res.status(403).json({ message: 'User is blocked' })
  }
  return null
}

// configure multer to store uploads in backend/uploads and keep original-ish filename
// resolve path relative to this file to avoid process.cwd() differences
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, '..', 'uploads')
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '-')
    cb(null, `${Date.now()}-${safe}`)
  }
})
const upload = multer({ storage })

// list
router.get('/', async (req, res) => {
  const { category } = req.query
  const where = {}
  if (category && category !== 'All') {
    where.category = category
  }
  const items = await Product.find(where).sort({ createdAt: -1 })
  res.json(items)
})

// get
router.get('/:id', async (req, res) => {
  const item = await Product.findById(req.params.id)
  if(!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
})

// create (accepts multipart/form-data with optional `image` file)
router.post('/', upload.single('image'), async (req, res) => {
  // Basic role enforcement: only producers may create products.
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'producer') {
    return res.status(403).json({ message: 'Only producers may create products' })
  }

  const blockedRes = await requireNotBlockedProducer(req, res)
  if (blockedRes) return

  try{
    const data = { ...req.body }
    // convert numeric fields
    if(data.price) data.price = Number(data.price)
    if(data.stock) data.stock = Number(data.stock)
    if(req.file){
      // path served at /uploads/<filename>
      data.image = `/uploads/${req.file.filename}`
    }
    const p = new Product(data)
    await p.save()
    res.status(201).json(p)
  }catch(err){
    console.error(err)
    res.status(500).json({ message: 'Failed to create product' })
  }
})

// update
router.put('/:id', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'producer' && role !== 'admin') {
    return res.status(403).json({ message: 'Only producers or admins may update products' })
  }

  const blockedRes = await requireNotBlockedProducer(req, res)
  if (blockedRes) return

  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if(!p) return res.status(404).json({ message: 'Not found' })
  res.json(p)
})

// delete
router.delete('/:id', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'producer' && role !== 'admin') {
    return res.status(403).json({ message: 'Only producers or admins may delete products' })
  }

  const blockedRes = await requireNotBlockedProducer(req, res)
  if (blockedRes) return

  await Product.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

// Add a review to a product and update rating aggregates
router.post('/:id/reviews', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'buyer') {
    return res.status(403).json({ message: 'Only buyers may leave reviews' })
  }

  const reviewerId = String(req.headers['x-user-id'] || '').trim()
  const { name = 'Anonymous', rating, comment = '' } = req.body || {}
  if(!rating || rating < 1 || rating > 5){
    return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  }
  const product = await Product.findById(req.params.id)
  if(!product) return res.status(404).json({ message: 'Not found' })

  product.reviews.push({ userId: reviewerId || undefined, name, rating, comment, date: new Date() })
  product.ratingCount = product.reviews.length
  const sum = product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0)
  product.ratingAvg = product.ratingCount ? (sum / product.ratingCount) : 0
  await product.save()
  res.status(201).json(product)
})

export default router