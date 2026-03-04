import express from 'express'
const router = express.Router()

import Order from '../models/Order.js'
import Product from '../models/Product.js'

router.get('/', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 })
  res.json(orders)
})

router.get('/producer/:producerName', async (req, res) => {
  try {
    const { producerName } = req.params
    
    // Find all products by this producer
    const products = await Product.find({ producer: producerName })
    const productIds = products.map(p => p._id.toString())
    
    // Find orders containing any of these products
    const orders = await Order.find({
      'items.productId': { $in: productIds }
    })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
    
    // Filter items to only include this producer's products
    const filteredOrders = orders.map(order => {
      const myItems = order.items.filter(item => 
        productIds.includes(item.productId.toString())
      )
      return {
        ...order.toObject(),
        items: myItems,
        total: myItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
      }
    })
    
    res.json(filteredOrders)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch orders' })
  }
})

router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params
    const orders = await Order.find({ customer: customerId })
      .populate('items.productId', 'name image price')
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch orders' })
  }
})

router.put('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params
    const { paymentMethod, paymentStatus } = req.body || {}

    const update = {}
    if (paymentMethod) update.paymentMethod = paymentMethod
    if (paymentStatus) update.paymentStatus = paymentStatus

    const order = await Order.findByIdAndUpdate(id, update, { new: true })
    if (!order) return res.status(404).json({ message: 'Not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update payment' })
  }
})

function normalizeStatus(value, fallback = 'pending') {
  const v = String(value || '').toLowerCase().trim()
  return v || fallback
}

function recomputeOrderStatus(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  if (!items.length) return normalizeStatus(order?.status)

  const statuses = items.map(it => normalizeStatus(it?.producerStatus, 'pending'))

  const hasPending = statuses.some(s => s === 'pending')
  if (hasPending) return 'pending'

  const allRejected = statuses.every(s => s === 'rejected')
  if (allRejected) return 'rejected'

  const allShippedOrRejected = statuses.every(s => s === 'shipped' || s === 'rejected')
  if (allShippedOrRejected) return 'shipped'

  return 'accepted'
}

function findItemsByProductId(order, productIdParam) {
  const items = Array.isArray(order?.items) ? order.items : []
  const pid = String(productIdParam || '')
  if (!pid) return []
  return items.filter(it => String(it?.productId || '') === pid)
}

// Notifications removed.

// Producer item-level actions (per product)
router.put('/:id/items/:productId/accept', async (req, res) => {
  try {
    const { id, productId } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Not found' })

    const targets = findItemsByProductId(order, productId)
    if (!targets.length) return res.status(404).json({ message: 'Order item not found' })

    // Only accept pending items
    for (const it of targets) {
      const st = normalizeStatus(it?.producerStatus, 'pending')
      if (st !== 'pending') {
        return res.status(400).json({ message: 'Only pending items can be accepted' })
      }
    }

    // Pre-check inventory for all matching items (avoid partial decrements)
    const checks = []
    for (const it of targets) {
      const qty = Number(it?.qty) || 0
      if (qty <= 0) return res.status(400).json({ message: 'Invalid qty in order item' })
      const product = await Product.findById(it.productId)
      if (!product) return res.status(400).json({ message: 'Product not found for an order item' })
      if ((Number(product.stock) || 0) < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name || 'product'}` })
      }
      checks.push({ product, qty })
    }

    // Apply decrements + status updates
    for (const { product, qty } of checks) {
      product.stock = Math.max(0, (Number(product.stock) || 0) - qty)
      await product.save()
    }

    for (const it of targets) {
      it.producerStatus = 'accepted'
    }

    order.status = recomputeOrderStatus(order)
    await order.save()
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to accept order item' })
  }
})

router.put('/:id/items/:productId/reject', async (req, res) => {
  try {
    const { id, productId } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Not found' })

    const targets = findItemsByProductId(order, productId)
    if (!targets.length) return res.status(404).json({ message: 'Order item not found' })

    for (const it of targets) {
      const st = normalizeStatus(it?.producerStatus, 'pending')
      if (st !== 'pending') {
        return res.status(400).json({ message: 'Only pending items can be rejected' })
      }
    }

    for (const it of targets) {
      it.producerStatus = 'rejected'
    }

    order.status = recomputeOrderStatus(order)
    await order.save()
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to reject order item' })
  }
})

router.put('/:id/items/:productId/ship', async (req, res) => {
  try {
    const { id, productId } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Not found' })

    const targets = findItemsByProductId(order, productId)
    if (!targets.length) return res.status(404).json({ message: 'Order item not found' })

    for (const it of targets) {
      const st = normalizeStatus(it?.producerStatus, 'pending')
      if (st !== 'accepted') {
        return res.status(400).json({ message: 'Only accepted items can be marked shipped' })
      }
    }

    for (const it of targets) {
      it.producerStatus = 'shipped'
    }

    order.status = recomputeOrderStatus(order)
    await order.save()
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to mark order item shipped' })
  }
})

// Producer actions
router.put('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Not found' })
    if (String(order.status || '').toLowerCase() !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be accepted' })
    }

    const items = Array.isArray(order.items) ? order.items : []
    if (items.length === 0) return res.status(400).json({ message: 'Order has no items' })

    // Pre-check inventory for all items (avoid partial decrements)
    const productsById = new Map()
    for (const it of items) {
      const productId = it?.productId
      const qty = Number(it?.qty) || 0
      if (!productId) return res.status(400).json({ message: 'Missing productId in order items' })
      if (qty <= 0) return res.status(400).json({ message: 'Invalid qty in order items' })

      const product = await Product.findById(productId)
      if (!product) return res.status(400).json({ message: 'Product not found for an order item' })
      if ((Number(product.stock) || 0) < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name || 'product'}` })
      }
      productsById.set(String(product._id), product)
    }

    // Apply decrements
    for (const it of items) {
      const product = productsById.get(String(it.productId))
      const qty = Number(it?.qty) || 0
      product.stock = Math.max(0, (Number(product.stock) || 0) - qty)
      await product.save()
    }

    for (const it of items) {
      it.producerStatus = 'accepted'
    }
    order.status = recomputeOrderStatus(order)
    await order.save()

    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to accept order' })
  }
})

router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Not found' })
    if (String(order.status || '').toLowerCase() !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be rejected' })
    }

    const items = Array.isArray(order.items) ? order.items : []
    for (const it of items) {
      if (normalizeStatus(it?.producerStatus, 'pending') === 'pending') {
        it.producerStatus = 'rejected'
      }
    }

    order.status = recomputeOrderStatus(order)
    await order.save()

    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to reject order' })
  }
})

router.put('/:id/ship', async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Not found' })
    if (String(order.status || '').toLowerCase() !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted orders can be marked shipped' })
    }

    const items = Array.isArray(order.items) ? order.items : []
    for (const it of items) {
      if (normalizeStatus(it?.producerStatus, 'pending') === 'accepted') {
        it.producerStatus = 'shipped'
      }
    }

    order.status = recomputeOrderStatus(order)
    await order.save()

    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to mark shipped' })
  }
})

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
  if(!order) return res.status(404).json({ message: 'Not found' })
  res.json(order)
})

router.post('/', async (req, res) => {
  try {
    const { items, total, customer } = req.body
    const o = new Order({ items, total, customer })
    await o.save()

    res.status(201).json(o)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create order' })
  }
})


export default router
