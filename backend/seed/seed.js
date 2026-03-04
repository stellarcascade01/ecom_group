import dotenv from 'dotenv'
dotenv.config()
import process from 'process'
import bcrypt from 'bcryptjs'
import connectDB from '../config/db.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

async function seed(){
  await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/jute_ecommerce')
  await Product.deleteMany({})
  await User.deleteMany({})

  const products = [
    { name: 'Jute Tote Bag', producer: 'GreenFields', price: 450, image: '', category: 'Bags', stock: 24 },
    { name: 'Handwoven Jute Rug', producer: 'Handloom Co', price: 2500, image: '', category: 'Rugs', stock: 6 },
    { name: 'Jute Floor Mat', producer: 'Coastal Jute', price: 700, image: '', category: 'Mats', stock: 12 },
    { name: 'Jute Plant Pot Cover', producer: 'UrbanGrow', price: 350, image: '', category: 'Planters', stock: 30 },
    { name: 'Jute Cushion Cover', producer: 'HomeWeave', price: 320, image: '', category: 'Home Decor', stock: 40 },
    { name: 'Jute Wallet', producer: 'PocketWorks', price: 220, image: '', category: 'Accessories', stock: 50 },
    { name: 'Jute Table Runner', producer: 'TableTales', price: 480, image: '', category: 'Kitchen', stock: 18 },
    { name: 'Jute Garden Hammock', producer: 'OutdoorCo', price: 1800, image: '', category: 'Garden', stock: 8 },
    { name: 'Jute Wall Hanging', producer: 'Artisan Loft', price: 950, image: '', category: 'Wall Hangings', stock: 10 },
    { name: 'Small Jute Bench', producer: 'FurnishCraft', price: 5400, image: '', category: 'Furniture', stock: 5 }
  ]

  const baseUsers = [
    { name: 'Asha Admin', email: 'admin@jute.com', phone: '0111111111', password: 'admin123', role: 'admin' },
    { name: 'Pavel Producer', email: 'producer@jute.com', phone: '0222222222', password: 'producer123', role: 'producer' },
    { name: 'Bela Buyer', email: 'buyer@jute.com', phone: '0333333333', password: 'buyer123', role: 'buyer' }
  ]

  const users = []
  for (const base of baseUsers){
    const hash = await bcrypt.hash(base.password, 10)
    users.push({ ...base, password: hash })
  }

  await Product.insertMany(products)
  await User.insertMany(users)

  console.log('Seed complete')
  process.exit(0)
}

seed().catch(err=>{ console.error(err); process.exit(1) })
