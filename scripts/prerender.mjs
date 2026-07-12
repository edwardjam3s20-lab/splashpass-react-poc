#!/usr/bin/env node
// scripts/prerender.mjs
//
// Runs AFTER `vite build`. dist/index.html (the built template, with the
// real hashed asset URLs already in place) is used as the shared base for
// every generated page.
//
// WHY THIS EXISTS
// SplashPass is an auth-gated booking app: almost every route (bookings,
// wallet, QR, profile, plans...) requires a signed-in user and has no
// public, indexable content — those must NOT be prerendered or indexed.
// Only a handful of entry points are genuinely public. For those, Google
// currently sees an empty `<div id="root"></div>` (real content is
// injected by JS after load), and non-JS bots — WhatsApp, LinkedIn, X,
// Slack — see nothing at all, so every shared link shows the same blank
// generic preview. This script fixes both by writing real, static
// per-route HTML with unique <title>/description/canonical/OG/Twitter
// tags, straight to dist/.
//
// WHY NOT full renderToString() of the real screen components (as a
// generic version of this playbook would do): AuthScreen, WelcomeScreen
// etc. pull in Supabase, Zustand app state, and router hooks that aren't
// meaningful (or safe) to execute at build time with no signed-in user.
// Instead each route below has a small, hand-written HTML snippet that
// mirrors that screen's real copy. main.tsx uses createRoot(...).render(),
// NOT hydrateRoot, so this fallback content is fully replaced the instant
// React mounts client-side — real users see it for a flash at most, and
// there's no hydration-mismatch risk.
//
// `routes` below is the single source of truth: it drives the prerendered
// pages AND the generated robots.txt / sitemap.xml, so the three can't
// drift out of sync.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '../dist')
const TEMPLATE_PATH = path.join(DIST, 'index.html')

const SITE_URL = 'https://www.splashpass.site'
const OG_IMAGE = `${SITE_URL}/og-image.png`

/** Every publicly indexable route. Add a route here — and ONLY here — to
 *  make it discoverable by Google and get it a real link preview. */
const routes = [
  {
    path: '/',
    title: 'SplashPass – Car Wash Booking App for Mombasa',
    description:
      'Book car washes instantly, check in with a QR code, and enjoy member-only pricing at verified wash points across Mombasa. Pay easily with M-Pesa.',
    priority: '1.0',
    changefreq: 'weekly',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SplashPass',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description: 'Car wash booking and subscription app for Mombasa, Kenya.',
    },
    body: `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0A1628;color:#fff;font-family:sans-serif;text-align:center;padding:24px;">
        <h1 style="font-size:28px;font-weight:800;margin-bottom:6px;">SplashPass</h1>
        <p style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:24px;">Premium Car Care</p>
        <p style="max-width:320px;color:rgba(255,255,255,0.7);line-height:1.6;">Book car washes instantly, check in with a QR code, and enjoy member-only pricing at verified wash points across Mombasa.</p>
        <p style="margin-top:24px;"><a href="/welcome" style="color:#0A84FF;font-weight:700;text-decoration:none;">Get started &rarr;</a></p>
      </div>`,
  },
  {
    path: '/welcome',
    title: 'Unlimited Car Wash Access – SplashPass',
    description:
      'Book washes instantly, check in with QR codes, and enjoy member-only pricing across Mombasa. 30-day free trial, no credit card needed.',
    priority: '0.9',
    changefreq: 'weekly',
    body: `
      <div style="min-height:100vh;background:#F5F5F7;font-family:sans-serif;color:#111;padding:32px 24px;">
        <h1 style="font-size:28px;font-weight:800;margin-bottom:12px;">Unlimited Car Wash Access</h1>
        <p style="color:#555;line-height:1.6;max-width:420px;margin-bottom:24px;">Book washes instantly, check in with QR codes, and enjoy member-only pricing across Mombasa.</p>
        <ul style="list-style:none;padding:0;max-width:420px;">
          <li style="margin-bottom:12px;"><strong>Book in 3 taps</strong> &mdash; Select service, date, and pay via M-Pesa</li>
          <li style="margin-bottom:12px;"><strong>QR Wash Pass</strong> &mdash; Instant QR code delivered after booking</li>
          <li style="margin-bottom:12px;"><strong>Member pricing</strong> &mdash; No per-booking app fee on subscription</li>
          <li style="margin-bottom:12px;"><strong>Trusted partners</strong> &mdash; Verified wash points across Mombasa</li>
        </ul>
        <p><a href="/auth/register" style="color:#0A84FF;font-weight:700;text-decoration:none;">Get started &rarr;</a> &nbsp;|&nbsp; <a href="/auth/login" style="color:#111;font-weight:700;text-decoration:none;">Sign in</a></p>
        <p style="color:#888;font-size:12px;margin-top:16px;">30-day free trial &middot; No credit card needed</p>
      </div>`,
  },
  {
    path: '/auth/login',
    title: 'Sign In – SplashPass',
    description:
      'Sign in to your SplashPass account to book car washes, manage your subscription, and access your QR wash pass.',
    priority: '0.3',
    changefreq: 'monthly',
    body: `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:24px;text-align:center;">
        <h1 style="font-size:24px;font-weight:800;margin-bottom:12px;">Sign in to SplashPass</h1>
        <p style="color:#555;max-width:320px;line-height:1.6;">Access your bookings, wallet, and QR wash pass.</p>
        <p style="margin-top:20px;"><a href="/auth/register" style="color:#0A84FF;font-weight:700;text-decoration:none;">Create an account</a> &nbsp;|&nbsp; <a href="/welcome" style="color:#111;text-decoration:none;">Learn more</a></p>
      </div>`,
  },
  {
    path: '/auth/register',
    title: 'Create Your Account – SplashPass',
    description:
      'Join SplashPass to book instant car washes, pay via M-Pesa, and enjoy member-only pricing across Mombasa. 30-day free trial.',
    priority: '0.5',
    changefreq: 'monthly',
    body: `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:24px;text-align:center;">
        <h1 style="font-size:24px;font-weight:800;margin-bottom:12px;">Create your SplashPass account</h1>
        <p style="color:#555;max-width:320px;line-height:1.6;">Book instant car washes, pay via M-Pesa, and enjoy member-only pricing across Mombasa. 30-day free trial, no credit card needed.</p>
        <p style="margin-top:20px;"><a href="/auth/login" style="color:#0A84FF;font-weight:700;text-decoration:none;">Sign in instead</a> &nbsp;|&nbsp; <a href="/welcome" style="color:#111;text-decoration:none;">Learn more</a></p>
      </div>`,
  },
]

// Strip the template's default head tags before injecting per-route ones,
// so the final HTML never has duplicate title/description/OG/Twitter/JSON-LD.
const DEFAULT_HEAD_PATTERNS = [
  /<title>[^<]*<\/title>\s*/i,
  /<meta\s+name="description"[^>]*>\s*/i,
  /<meta\s+property="og:[^"]*"[^>]*>\s*/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/i,
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
]

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildHead(route) {
  const url = `${SITE_URL}${route.path}`
  const lines = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="SplashPass" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  ]
  if (route.jsonLd) {
    lines.push(`<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`)
  }
  return lines.join('\n    ')
}

function injectIntoTemplate(template, route) {
  let html = template
  for (const re of DEFAULT_HEAD_PATTERNS) html = html.replace(re, '')
  html = html.replace('</head>', `${buildHead(route)}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${route.body}</div>`)
  return html
}

function writeRoute(html, routePath) {
  const rel = routePath === '/' ? 'index.html' : path.join(routePath.replace(/^\//, ''), 'index.html')
  const outPath = path.join(DIST, rel)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html, 'utf8')
}

function writeRobotsTxt() {
  const allowLines = routes.map((r) => `Allow: ${r.path === '/' ? '/$' : `${r.path}$`}`)
  const content = [
    'User-agent: *',
    'Disallow: /',
    ...allowLines,
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n')
  fs.writeFileSync(path.join(DIST, 'robots.txt'), content, 'utf8')
}

function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n')
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), content, 'utf8')
}

function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('✖ dist/index.html not found — run `vite build` first.')
    process.exit(1)
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8')

  let written = 0
  for (const route of routes) {
    try {
      writeRoute(injectIntoTemplate(template, route), route.path)
      written++
    } catch (err) {
      // Never fail the whole build for one route — worst case, that route
      // still falls back to the client-rendered SPA shell.
      console.warn(`⚠ prerender skipped ${route.path}: ${err.message}`)
    }
  }
  writeRobotsTxt()
  writeSitemap()
  console.log(`✔ prerendered ${written}/${routes.length} public routes + robots.txt + sitemap.xml`)
}

main()
