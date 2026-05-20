import express    from 'express'
import cors       from 'cors'
import helmet     from 'helmet'
import morgan     from 'morgan'
import dotenv     from 'dotenv'
import http       from 'http'
import aiRouter   from './src/routes/ai.js'
import gloveRouter from './src/routes/glove.js'
import { initWebSocket } from './src/config/websocket.js'

dotenv.config()

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 5000

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/ai',    aiRouter)
app.use('/api/glove', gloveRouter)

app.get('/api/health', (req, res) => {
  res.json({ status:'ok', time: new Date().toISOString() })
})

initWebSocket(server)

server.listen(PORT, () => {
  console.log(`✅ SynTalk server on http://localhost:${PORT}`)
  console.log(`✅ WebSocket ready at ws://localhost:${PORT}/ws`)
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use`)
    process.exit(1)
  }
})