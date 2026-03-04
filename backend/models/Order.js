import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  qty: Number,
  producerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'shipped'],
    default: 'pending'
  }
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  items: [OrderItemSchema],
  total: Number,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  paymentMethod: { type: String, enum: ['pending', 'cash', 'card', 'mfs'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true })

const Order= mongoose.model('Order', OrderSchema)
export default Order
