import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-dom'

const outputDirectory = process.argv.find(argument => argument.startsWith('--output-dir='))?.slice('--output-dir='.length)
if (outputDirectory === '') throw new Error('--output-dir requires a directory.')
const root = outputDirectory
  ? path.resolve(outputDirectory)
  : fileURLToPath(new URL('../docs/.vitepress/dist/', import.meta.url))
const base = '/dev-interview-guide/'
const origin = 'https://docs.invalid'
const siteOrigin = 'https://liukun2634.github.io'
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
  const titles = []
  const metadata = []
  const canonicals = []
  let language = ''
  const textContent = node => node.type === 2
    ? node.content
    : (node.children ?? []).map(textContent).join('')
  const visit = (node, insideHead = false) => {
    if (node.type === 1) {
      insideHead ||= node.tag === 'head'
      const attributes = Object.fromEntries(node.props
        .filter(attribute => attribute.type === 6 && attribute.value)
        .map(attribute => [attribute.name, attribute.value.content]))
      if (node.tag === 'html') language = attributes.lang ?? ''
      if (insideHead) {
        if (node.tag === 'title') titles.push(textContent(node).trim())
        if (node.tag === 'meta') metadata.push(attributes)
        if (node.tag === 'link' && attributes.rel?.toLowerCase().split(/\s+/).includes('canonical')) {
          canonicals.push(attributes.href ?? '')
        }
      }
      for (const attribute of node.props) {
        if (attribute.type !== 6 || !attribute.value) continue
        if (attribute.name === 'id') ids.add(attribute.value.content)
        if (node.tag === 'a' && attribute.name === 'href') {
          links.add(attribute.value.content)
        }
      }
    }
    for (const child of node.children ?? []) visit(child, insideHead)
  }
  visit(parse(html, { onError: () => {} }))
  return { ids, links, titles, metadata, canonicals, language }
}

function canonicalUrl(source) {
  return new URL(`${base}${source.replace(/(^|\/)index\.html$/, '$1')}`, siteOrigin).href
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
const linkSources = [...pages]

if (!sourceMode) {
  const sitemapUrls = new Set()
  const expectedUrls = new Set([...pages.keys()]
    .filter(source => source !== '404.html')
    .map(canonicalUrl))
  const sitemapPath = path.join(root, 'sitemap.xml')
  if (!fs.existsSync(sitemapPath)) {
    failures.push('sitemap.xml: missing sitemap')
  } else {
    const locations = []
    const visit = node => {
      if (node.type === 1 && node.tag === 'loc') {
        locations.push(node.children.filter(child => child.type === 2).map(child => child.content).join('').trim())
      }
      for (const child of node.children ?? []) visit(child)
    }
    visit(parse(fs.readFileSync(sitemapPath, 'utf8'), { onError: () => {} }))
    if (locations.length === 0) failures.push('sitemap.xml: no page locations')
    const links = new Set()
    for (const location of locations) {
      let url
      try {
        url = new URL(location)
      } catch {
        failures.push(`sitemap.xml: invalid URL ${location}`)
        continue
      }
      if (url.origin !== siteOrigin) {
        failures.push(`sitemap.xml: unexpected origin ${location}`)
        continue
      }
      if (url.search || url.hash) failures.push(`sitemap.xml: query or fragment in URL ${location}`)
      if (sitemapUrls.has(url.href)) failures.push(`sitemap.xml: duplicate URL ${location}`)
      if (!expectedUrls.has(url.href)) failures.push(`sitemap.xml: non-canonical or non-page URL ${location}`)
      sitemapUrls.add(url.href)
      links.add(`${url.pathname}${url.search}${url.hash}`)
    }
    linkSources.push(['sitemap.xml', { ids: new Set(), links }])
  }

  for (const [source, page] of pages) {
    if (page.titles.length !== 1 || !page.titles[0]) {
      failures.push(`${source}: expected one nonempty title in head`)
    }
    const descriptions = page.metadata.filter(meta => meta.name?.toLowerCase() === 'description')
    if (descriptions.length !== 1 || !descriptions[0].content?.trim()) {
      failures.push(`${source}: expected one nonempty meta description in head`)
    }
    if (!page.language.trim()) failures.push(`${source}: missing html lang`)
    const noindex = page.metadata.some(meta =>
      ['robots', 'googlebot'].includes(meta.name?.toLowerCase()) &&
      meta.content?.toLowerCase().split(/[\s,]+/).some(directive => ['noindex', 'none'].includes(directive)))
    if (source === '404.html') {
      if (!noindex) failures.push(`${source}: expected noindex`)
      if (page.canonicals.length) failures.push(`${source}: must not declare a canonical`)
      continue
    }
    if (noindex) failures.push(`${source}: unexpected noindex on a public page`)
    const expectedUrl = canonicalUrl(source)
    if (page.canonicals.length !== 1 || page.canonicals[0] !== expectedUrl) {
      failures.push(`${source}: expected exactly one self-canonical ${expectedUrl}`)
    }
    if (!sitemapUrls.has(expectedUrl)) failures.push(`${source}: canonical missing from sitemap`)
  }
}

for (const [source, page] of linkSources) {
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
  console.error(`FAIL: ${failures.length} document validation errors across ${pages.size} pages.`)
  process.exitCode = 1
} else {
  console.log(`PASS: internal pages, assets and anchors checked across ${pages.size} pages${sourceMode ? '' : ', including metadata, canonical, robots and sitemap URLs'}.`)
}