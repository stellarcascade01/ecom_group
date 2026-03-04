import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])
const RESOLVE_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json']

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.git'])

const isRelativeSpecifier = (spec) => spec.startsWith('./') || spec.startsWith('../')

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function listFilesRecursive(rootDir) {
  const result = []

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue
        await walk(path.join(dir, entry.name))
        continue
      }
      result.push(path.join(dir, entry.name))
    }
  }

  await walk(rootDir)
  return result
}

function extractModuleSpecifiers(sourceText) {
  const text = String(sourceText || '')
  const specifiers = []

  const patterns = [
    /\bimport\s+(?:[\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g,
    /\bexport\s+(?:[\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      specifiers.push(match[1])
    }
  }

  return specifiers
}

async function resolveImport(fromFile, specifier) {
  if (!isRelativeSpecifier(specifier)) return null

  const fromDir = path.dirname(fromFile)
  const basePath = path.resolve(fromDir, specifier)

  const hasExt = Boolean(path.extname(basePath))
  if (hasExt) {
    return (await fileExists(basePath)) ? basePath : null
  }

  for (const ext of RESOLVE_EXTS) {
    const candidate = `${basePath}${ext}`
    if (await fileExists(candidate)) return candidate
  }

  for (const ext of RESOLVE_EXTS) {
    const candidate = path.join(basePath, `index${ext}`)
    if (await fileExists(candidate)) return candidate
  }

  return null
}

async function collectReachableFiles(entryFiles) {
  const reachable = new Set()
  const queue = [...new Set(entryFiles)]

  while (queue.length > 0) {
    const filePath = queue.pop()
    if (!filePath || reachable.has(filePath)) continue
    reachable.add(filePath)

    const ext = path.extname(filePath)
    if (!CODE_EXTS.has(ext) && ext !== '.json') continue

    let content
    try {
      content = await fs.readFile(filePath, 'utf8')
    } catch {
      continue
    }

    const specs = extractModuleSpecifiers(content)
    for (const spec of specs) {
      const resolved = await resolveImport(filePath, spec)
      if (resolved && !reachable.has(resolved)) queue.push(resolved)
    }
  }

  return reachable
}

function normalize(p) {
  return path.resolve(p)
}

function toRelative(projectRoot, absPath) {
  return path.relative(projectRoot, absPath).replaceAll('\\', '/')
}

async function runScan({ projectRoot, label, rootDir, entries }) {
  const absRoot = normalize(path.join(projectRoot, rootDir))
  const absEntries = entries.map((e) => normalize(path.join(projectRoot, e)))

  const allFiles = (await listFilesRecursive(absRoot))
    .filter((p) => CODE_EXTS.has(path.extname(p)))

  const reachable = await collectReachableFiles(absEntries)

  const orphans = allFiles
    .filter((p) => !reachable.has(p))
    .map((p) => toRelative(projectRoot, p))
    .sort((a, b) => a.localeCompare(b))

  console.log(`\n${label}`)
  console.log(`Root: ${rootDir}`)
  console.log(`Entries: ${entries.join(', ')}`)
  console.log(`Total code files: ${allFiles.length}`)
  console.log(`Reachable: ${[...reachable].filter((p) => CODE_EXTS.has(path.extname(p)) && p.startsWith(absRoot)).length}`)
  console.log(`Orphans: ${orphans.length}`)

  for (const orphan of orphans) {
    console.log(`- ${orphan}`)
  }

  return orphans
}

const projectRoot = process.cwd()

const args = new Set(process.argv.slice(2))
const scanFrontend = args.size === 0 || args.has('--frontend')
const scanBackend = args.size === 0 || args.has('--backend')

const results = []
if (scanFrontend) {
  results.push(
    await runScan({
      projectRoot,
      label: 'Frontend orphan scan',
      rootDir: 'src',
      entries: ['src/main.jsx']
    })
  )
}

if (scanBackend) {
  results.push(
    await runScan({
      projectRoot,
      label: 'Backend orphan scan',
      rootDir: 'backend',
      entries: ['backend/server.js', 'backend/seed/seed.js']
    })
  )
}

const totalOrphans = results.flat().length
console.log(`\nDone. Total orphan files: ${totalOrphans}`)
