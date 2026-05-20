import { WebSocketServer, WebSocket } from 'ws'
import { gloveSerial } from './serial.js'

const clients = new Set()

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', ws => {
    clients.add(ws)
    console.log(`WS client connected (total: ${clients.size})`)

    // Send current state immediately on connect
    send(ws, {
      type:      'status',
      connected: gloveSerial.connected,
      port:      gloveSerial.portPath || null,
    })

    ws.on('close', () => {
      clients.delete(ws)
      console.log(`WS client disconnected (total: ${clients.size})`)
    })
    ws.on('error', () => clients.delete(ws))
  })

  // Listen to sensorData — this matches gloveSerial.emit('sensorData', ...)
  gloveSerial.on('sensorData', data => {
    broadcast({
      type:        'frame',
      raw:         data.raw,          // [index, middle, ring, pinky] integers
      alreadyNorm: data.alreadyNorm,  // true if JSON format (already 0-1000 scaled)
    })
  })

  gloveSerial.on('connected', ({ portPath }) => {
    console.log('Glove connected:', portPath)
    broadcast({ type: 'status', connected: true, port: portPath })
  })

  gloveSerial.on('disconnected', () => {
    console.log('Glove disconnected')
    broadcast({ type: 'status', connected: false, port: null })
  })

  gloveSerial.on('error', msg => {
    console.error('Glove error:', msg)
    broadcast({ type: 'error', message: msg })
  })
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify(data))
}

function broadcast(data) {
  const msg = JSON.stringify(data)
  for (const ws of clients)
    if (ws.readyState === WebSocket.OPEN)
      ws.send(msg)
}