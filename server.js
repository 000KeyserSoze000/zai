require('dotenv').config()
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000
const app = next({ dev })
const handle = app.getRequestHandler()

console.log(`[Server] Starting in ${dev ? 'development' : 'production'} mode...`)
console.log(`[Server] DATABASE_URL is set: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`)

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on port ${port}`)
  })
}).catch((err) => {
  console.error('[Server] Fatal Error during startup:', err)
  process.exit(1)
})
