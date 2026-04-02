import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import process from 'process'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { v2 as cloudinary } from 'cloudinary'

import connectDB from '../config/db.js'
import Product from '../models/Product.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnv(){
  const backendEnv = path.join(__dirname, '..', '.env')
  if (fs.existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv })
  } else {
    dotenv.config()
  }
}

function parseArgs(argv){
  const args = {
    apply: false,
    deleteLocal: false,
    limit: undefined,
  }

  for (const raw of argv) {
    if (raw === '--apply') args.apply = true
    else if (raw === '--delete-local') args.deleteLocal = true
    else if (raw.startsWith('--limit=')) {
      const value = Number(raw.slice('--limit='.length))
      if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid --limit')
      args.limit = Math.floor(value)
    } else if (raw === '--help' || raw === '-h') {
      console.log(`Usage: node scripts/migrateUploadsToCloudinary.js [--apply] [--delete-local] [--limit=N]\n\nDefault is dry-run (no DB writes, no uploads).\n\nOptions:\n  --apply          Upload to Cloudinary and update MongoDB\n  --delete-local   After successful upload, delete local backend/uploads file\n  --limit=N        Process only first N products matching /uploads/*\n`)
      process.exit(0)
    }
  }

  return args
}

function ensureCloudinaryConfigured(){
  const cloudinaryUrl = String(process.env.CLOUDINARY_URL || '').trim()
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim()
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim()

  if (cloudinaryUrl) {
    const parsed = new URL(cloudinaryUrl)
    if (parsed.protocol !== 'cloudinary:') throw new Error('CLOUDINARY_URL must start with cloudinary://')
    if (!parsed.hostname || !parsed.username || !parsed.password) {
      throw new Error('CLOUDINARY_URL is missing cloud name, api key, or api secret')
    }
    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
      secure: true,
    })
    return
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
    return
  }

  throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET in backend/.env')
}

async function fileExists(p){
  try {
    await fsp.access(p)
    return true
  } catch {
    return false
  }
}

async function main(){
  loadEnv()
  const { apply, deleteLocal, limit } = parseArgs(process.argv.slice(2))

  ensureCloudinaryConfigured()

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jute_ecommerce'
  await connectDB(mongoUri)

  const folder = String(process.env.CLOUDINARY_FOLDER || 'ecommerce_group').trim() || 'ecommerce_group'
  const uploadDir = path.join(__dirname, '..', 'uploads')

  const query = { image: /^\/uploads\// }
  const products = await Product.find(query).sort({ createdAt: 1 }).limit(limit || 10_000)

  let matched = 0
  let missingLocal = 0
  let uploaded = 0
  let updated = 0
  let failed = 0

  for (const product of products) {
    matched += 1

    const imagePath = String(product.image || '')
    const filename = path.posix.basename(imagePath)
    const localFile = path.join(uploadDir, filename)

    const exists = await fileExists(localFile)
    if (!exists) {
      missingLocal += 1
      console.log(`[SKIP] ${product._id}: local file missing (${localFile})`) 
      continue
    }

    if (!apply) {
      console.log(`[DRY]  ${product._id}: would upload ${localFile} and update image`) 
      continue
    }

    try {
      const result = await cloudinary.uploader.upload(localFile, {
        folder,
        resource_type: 'image',
      })

      const newUrl = result?.secure_url || result?.url
      if (!newUrl) throw new Error('Cloudinary returned no URL')

      uploaded += 1

      product.image = newUrl
      await product.save()
      updated += 1

      console.log(`[OK]   ${product._id}: updated image -> ${newUrl}`)

      if (deleteLocal) {
        try {
          await fsp.unlink(localFile)
          console.log(`       deleted local file ${localFile}`)
        } catch (err) {
          console.log(`       could not delete local file: ${String(err?.message || err)}`)
        }
      }
    } catch (err) {
      failed += 1
      console.log(`[FAIL] ${product._id}: ${String(err?.message || err)}`)
    }
  }

  console.log('\nSummary')
  console.log(`- Matched products: ${matched}`)
  console.log(`- Missing local files: ${missingLocal}`)
  console.log(`- Uploaded: ${uploaded}`)
  console.log(`- Updated: ${updated}`)
  console.log(`- Failed: ${failed}`)

  await mongoose.connection.close()
}

main().catch(async (err) => {
  console.error(err)
  try { await mongoose.connection.close() } catch { /* ignore */ }
  process.exit(1)
})
