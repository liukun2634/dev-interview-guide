import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-dom'

const root = fileURLToPath(new URL('../docs/.vitepress/dist/', import.meta.url))
const base = '/dev-interview-guide/'
const origin = 'https://docs.invalid'
const sourceMode = process.argv.includes('--source')

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath]
  })
}

function readPage(html) {
  const ids = new Set()
  const links = new Set()
  const visit = node => {
    if (node.type === 1) {
      for (const attribute of node.props) {
        if (attribute.type !== 6 || !attribute.value) continue
        if (attribute.name === 'id') ids.add(attribute.value.content)
        if (node.tag === 'a' && attribute.name === 'href') {
          links.add(attribute.value.content)
        }
      }
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(parse(html, { onError: () => {} }))
  return { ids, links }
}

if (!sourceMode && !fs.existsSync(root)) {
  console.error('Build output is missing. Run npm run docs:build first.')
  process.exit(1)
}

const pages = new Map()
let assetRoot = root
if (sourceMode) {
  const { resolveConfig, createMarkdownRenderer } = await import('vitepress')
  const config = await resolveConfig(fileURLToPath(new URL('../docs/', import.meta.url)))
  if (config.site.base !== base) throw new Error('Update the link checker base to match site configuration.')
  const markdown = await createMarkdownRenderer(config.srcDir, config.markdown, base, config.logger)
  assetRoot = path.join(config.srcDir, 'public')
  for (const relativePath of config.pages) {
    const file = path.join(config.srcDir, relativePath)
    const html = markdown.render(fs.readFileSync(file, 'utf8'), {
      path: file,
      relativePath,
      cleanUrls: config.cleanUrls,
    })
    pages.set(relativePath.replace(/\.md$/, '.html'), readPage(html))
  }
} else {
  for (const file of listFiles(root).filter(file => file.endsWith('.html'))) {
    pages.set(path.relative(root, file).split(path.sep).join('/'), readPage(fs.readFileSync(file, 'utf8')))
  }
}
const failures = []

for (const [source, page] of pages) {
  for (const href of page.links) {
    let url
    try {
      url = new URL(href, `${origin}${base}${source}`)
    } catch {
      failures.push(`${source}: invalid URL ${href}`)
      continue
    }
    if (url.origin !== origin) continue
    if (!url.pathname.startsWith(base)) {
      failures.push(`${source}: outside site base ${href}`)
      continue
    }
    let target
    let fragment
    try {
      target = decodeURIComponent(url.pathname.slice(base.length))
      fragment = decodeURIComponent(url.hash.slice(1))
    } catch {
      failures.push(`${source}: invalid URL encoding ${href}`)
      continue
    }
    if (!target || target.endsWith('/')) target += 'index.html'
    else if (!path.extname(target)) target += '.html'
    if (!pages.has(target)) {
      const assetPath = path.resolve(assetRoot, target)
      if (!assetPath.startsWith(`${assetRoot}${path.sep}`) || !fs.existsSync(assetPath)) {
        failures.push(`${source}: missing page or asset ${href}`)
      }
    } else if (fragment && !pages.get(target).ids.has(fragment)) {
      failures.push(`${source}: missing anchor ${href}`)
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  console.error(`FAIL: ${failures.length} broken links across ${pages.size} pages.`)
  process.exitCode = 1
} else {
  console.log(`PASS: internal pages, assets and anchors checked across ${pages.size} pages.`)
}