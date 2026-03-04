import express from 'express'
const router = express.Router()
import User, { USER_ROLES } from '../models/User.js'
import bcrypt from 'bcryptjs'

// list users (no passwords)
router.get('/', async (req, res) => {
  const users = await User.find().select('-password')
  res.json(users)
})

// register new user
router.post('/', async (req, res) => {
  try {
    let { name, email, phone, password, role } = req.body

    // normalize inputs
    name = name && String(name).trim()
    email = email && String(email).trim()
    phone = phone && String(phone).trim()
    password = password && String(password)

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ message: 'Name, password, and (email or phone) required' })
    }

    // normalize email to lowercase for uniqueness
    if (email) email = email.toLowerCase()

    const normalizedRole = USER_ROLES.includes(role) ? role : 'buyer'

    // build dynamic matching conditions (only include fields that exist)
    const conditions = []
    if (email) conditions.push({ email })
    if (phone) conditions.push({ phone })

    // defensive: if conditions is empty (shouldn't be), block
    if (conditions.length === 0) {
      return res.status(400).json({ message: 'Email or phone is required' })
    }

    const existing = await User.findOne({ $or: conditions })
    if (existing) return res.status(400).json({ message: 'Email/Phone already registered' })

    const hash = await bcrypt.hash(password, 10)

    // IMPORTANT: set undefined when missing (do NOT set null or "")
    const u = new User({
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      password: hash,
      role: normalizedRole
    })

    await u.save()

    const out = u.toObject()
    delete out.password

    res.status(201).json(out)
  } catch (err) {
    console.error('User registration error:', err)
    // handle duplicate key gracefully
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate field value (email or phone).' })
    }
    res.status(500).json({ message: 'Registration failed' })
  }
})

// update avatar
router.put('/:id/avatar', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'producer' && role !== 'buyer' && role !== 'admin') {
    return res.status(403).json({ message: 'Only authenticated users can update avatars' })
  }

  const { avatar } = req.body || {}
  if (!avatar || typeof avatar !== 'string') {
    return res.status(400).json({ message: 'Avatar is required' })
  }

  const user = await User.findByIdAndUpdate(req.params.id, { avatar }, { new: true }).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user)
})

// update profile (name, email, phone)
router.put('/:id/profile', async (req, res) => {
  const { name, email, phone } = req.body || {}
  const updates = {}
  
  if (name && typeof name === 'string') updates.name = name.trim()
  if (email && typeof email === 'string') updates.email = email.trim().toLowerCase()
  if (phone && typeof phone === 'string') updates.phone = phone.trim()

  try {
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or phone already in use' })
    }
    res.status(500).json({ message: 'Profile update failed' })
  }
})

// admin: block/unblock user
router.put('/:id/blocked', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toLowerCase()
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can block/unblock users' })
  }

  const { blocked } = req.body || {}
  if (typeof blocked !== 'boolean') {
    return res.status(400).json({ message: 'blocked must be a boolean' })
  }

  const user = await User.findByIdAndUpdate(req.params.id, { blocked }, { new: true }).select('-password')
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user)
})

// add shipping address
router.post('/:id/addresses', async (req, res) => {
  const { label, name, email, phone, address, city, postalCode, country, isDefault } = req.body || {}
  
  if (!address || !city) {
    return res.status(400).json({ message: 'Address and city are required' })
  }

  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    // If marking as default, unset other defaults
    if (isDefault) {
      user.shippingAddresses.forEach(addr => { addr.isDefault = false })
    }

    user.shippingAddresses.push({
      label: label || 'Address',
      name: name || user.name,
      email: email || user.email || '',
      phone: phone || user.phone || '',
      address,
      city,
      postalCode: postalCode || '',
      country: country || 'Bangladesh',
      isDefault: isDefault && user.shippingAddresses.length === 0 ? true : false
    })

    await user.save()
    const userObj = user.toObject()
    delete userObj.password
    res.status(201).json(userObj)
  } catch (err) {
    console.error('Add address error:', err)
    res.status(500).json({ message: 'Failed to add address' })
  }
})

// update shipping address
router.put('/:id/addresses/:addrId', async (req, res) => {
  const { label, name, email, phone, address, city, postalCode, country, isDefault } = req.body || {}
  
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    const addr = user.shippingAddresses.id(req.params.addrId)
    if (!addr) return res.status(404).json({ message: 'Address not found' })

    // Update fields
    if (label) addr.label = label
    if (name) addr.name = name
    if (email) addr.email = email
    if (phone) addr.phone = phone
    if (address) addr.address = address
    if (city) addr.city = city
    if (postalCode !== undefined) addr.postalCode = postalCode
    if (country) addr.country = country

    // If marking as default, unset others
    if (isDefault) {
      user.shippingAddresses.forEach(a => { a.isDefault = false })
      addr.isDefault = true
    }

    await user.save()
    const userObj = user.toObject()
    delete userObj.password
    res.json(userObj)
  } catch (err) {
    console.error('Update address error:', err)
    res.status(500).json({ message: 'Failed to update address' })
  }
})

// delete shipping address
router.delete('/:id/addresses/:addrId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    user.shippingAddresses.id(req.params.addrId).deleteOne()
    await user.save()
    const userObj = user.toObject()
    delete userObj.password
    res.json(userObj)
  } catch (err) {
    console.error('Delete address error:', err)
    res.status(500).json({ message: 'Failed to delete address' })
  }
})

export default router