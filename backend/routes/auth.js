import express from 'express'
const router = express.Router()
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try{
    const { identifier, password } = req.body
    if(!identifier || !password){
      return res.status(400).json({ message: 'Email/Phone and password are required' })
    }
    const user = await User.findOne({ 
        $or: [
            {email: identifier} ,
            {phone: identifier}
        ]
        }).lean()

    if(!user) {
        return res.status(401).json({ message: 'Invalid login credentials' })
    }
    const match = await bcrypt.compare(password, user.password)
    if(!match) {
        return res.status(401).json({ message: 'Invalid login credentials' })
    }
    
    const { password: _pw, ...safe } = user
    res.json({ user: safe })
  }catch(err){
    console.error(err)
    res.status(500).json({ message: 'Login failed' })
  }
})

export default router
