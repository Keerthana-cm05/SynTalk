import express   from 'express'
import cors      from 'cors'
import helmet    from 'helmet'
import morgan    from 'morgan'
import dotenv    from 'dotenv'
import http      from 'http'

import aiRouter    from './src/routes/ai.js'
import gloveRouter from './src/routes/glove.js'
import { initWebSocket } from './src/config/websocket.js'

dotenv.config()

const app    = express()
const server = http.createServer(app)   // ← shared server for WS
const PORT   = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/api/ai',    aiRouter)
app.use('/api/glove', gloveRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Boot WebSocket on same HTTP server
initWebSocket(server)

server.listen(PORT, () => {
  console.log(`✅ SynTalk server on http://localhost:${PORT}`)
  console.log(`✅ WebSocket ready at ws://localhost:${PORT}/ws`)
})