import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const checker = fileURLToPath(new URL('./check-doc-links.mjs', import.meta.url))
const site = 'https://liukun2634.github.io/dev-interview-guide/'
const canonical = suffix => `<link rel="canonical" href="${site}${suffix}">`
const page = head => `<!doctype html><html lang="zh-CN"><head><title>Example</title><meta name="description" content="Existing summary">${head}</head><body></body></html>`
const fixtures = () => ({
  'index.html': page(canonical('')),
  'guide/index.html': page(canonical('guide/')),
  'guide/topic.html': page(canonical('guide/topic.html')),
  '404.html': page('<meta name="robots" content="noindex">'),
  'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', 'guide/', 'guide/topic.html'].map(suffix => `<url><loc>${site}${suffix}</loc></url>`).join('')}</urlset>`,
})

function check(files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-seo-check-'))
  try {
    for (const [filename, contents] of Object.entries(files)) {
      const destination = path.join(directory, filename)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, contents)
    }
    const result = spawnSync(process.execPath, [checker, `--output-dir=${directory}`], { encoding: 'utf8' })
    if (result.error) throw result.error
    return result
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

test('accepts home, nested index, article and noindex 404', () => {
  const result = check(fixtures())
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /metadata, canonical, robots and sitemap/)
})

const defects = [
  ['missing canonical', 'guide/topic.html', html => html.replace(canonical('guide/topic.html'), ''), /expected exactly one self-canonical/],
  ['duplicate canonical', 'guide/topic.html', html => html.replace('</head>', `${canonical('guide/topic.html')}</head>`), /expected exactly one self-canonical/],
  ['canonical for wrong page', 'guide/topic.html', html => html.replace(canonical('guide/topic.html'), canonical('')), /expected exactly one self-canonical/],
  ['relative canonical', 'guide/topic.html', html => html.replace(`${site}guide/topic.html`, '/dev-interview-guide/guide/topic.html'), /expected exactly one self-canonical/],
  ['title missing', 'guide/topic.html', html => html.replace('<title>Example</title>', ''), /nonempty title/],
  ['description empty', 'guide/topic.html', html => html.replace('Existing summary', ''), /nonempty meta description/],
  ['description duplicated', 'guide/topic.html', html => html.replace('</head>', '<meta name="description" content="Duplicate"></head>'), /nonempty meta description/],
  ['language missing', 'guide/topic.html', html => html.replace('lang="zh-CN"', ''), /missing html lang/],
  ['public page noindex', 'guide/topic.html', html => html.replace('</head>', '<meta name="robots" content="NOINDEX, follow"></head>'), /unexpected noindex/],
  ['googlebot none', 'guide/topic.html', html => html.replace('</head>', '<meta name="googlebot" content="none"></head>'), /unexpected noindex/],
  ['404 indexed', '404.html', html => html.replace('noindex', 'index'), /expected noindex/],
  ['404 canonical', '404.html', html => html.replace('</head>', `${canonical('404.html')}</head>`), /must not declare a canonical/],
  ['wrong sitemap origin', 'sitemap.xml', xml => xml.replaceAll(site, 'https://example.invalid/'), /unexpected origin/],
  ['sitemap duplicate', 'sitemap.xml', xml => xml.replace('</urlset>', `<url><loc>${site}</loc></url></urlset>`), /duplicate URL/],
  ['sitemap missing page', 'sitemap.xml', xml => xml.replace(`<url><loc>${site}guide/topic.html</loc></url>`, ''), /canonical missing from sitemap/],
  ['sitemap index alias', 'sitemap.xml', xml => xml.replace(`${site}guide/</loc>`, `${site}guide/index.html</loc>`), /non-canonical or non-page URL/],
  ['sitemap query string', 'sitemap.xml', xml => xml.replace(`${site}guide/topic.html</loc>`, `${site}guide/topic.html?source=test</loc>`), /query or fragment/],
  ['sitemap includes 404', 'sitemap.xml', xml => xml.replace('</urlset>', `<url><loc>${site}404.html</loc></url></urlset>`), /non-canonical or non-page URL/],
  ['broken anchor still checked', 'guide/topic.html', html => html.replace('</body>', '<a href="#missing">Missing</a></body>'), /missing anchor/],
]

for (const [name, filename, mutate, expected] of defects) {
  test(`rejects ${name}`, () => {
    const files = fixtures()
    files[filename] = mutate(files[filename])
    const result = check(files)
    assert.equal(result.status, 1, result.stdout)
    assert.match(result.stderr, expected)
  })
}