import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema({
  userId: { type: String },
  name: { type: String, default: 'Anonymous' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  date: { type: Date, default: Date.now }
}, { _id: false })

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  producer: { type: String },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  category: { type: String },
  stock: { type: Number, default: 0, min: 0 },
  reviews: { type: [ReviewSchema], default: [] },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true })

const Product = mongoose.model('Product', ProductSchema)
export default Product
