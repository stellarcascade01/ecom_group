import mongoose from 'mongoose'

export const USER_ROLES = ['buyer','producer','admin']

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },    // unique only if field exists
  phone: { type: String, unique: true, sparse: true },    // unique only if field exists
  password: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: 'buyer' },
  blocked: { type: Boolean, default: false },
  avatar: { type: String },
  shippingAddresses: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    label: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'Bangladesh' },
    isDefault: { type: Boolean, default: false }
  }]
}, { timestamps: true })

const User = mongoose.model('User', UserSchema)
export default User
