import { WebSocketServer, WebSocket } from 'ws'
import { gloveSerial } from './serial.js'

let wss     = null
const clients = new Set()

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', ws => {
    clients.add(ws)
    console.log(`WS client connected. Total: ${clients.size}`)

    // Send current state immediately
    send(ws, {
      type:      'status',
      connected: gloveSerial.connected,
      port:      gloveSerial.portPath || null,
    })

    ws.on('close',  () => clients.delete(ws))
    ws.on('error',  () => clients.delete(ws))
  })

  gloveSerial.on('sensorData', data => {
    // Send raw values — frontend handles normalization with calibration
    broadcast({
      type:   'frame',
      raw:    data.raw,       // [index, middle, ring, pinky] integers
      isNorm: data.isNorm,    // whether already 0-1
      ts:     data.ts,
    })
  })

  gloveSerial.on('connected',    ({ portPath }) => broadcast({ type: 'status', connected: true,  port: portPath }))
  gloveSerial.on('disconnected', ()             => broadcast({ type: 'status', connected: false, port: null    }))
  gloveSerial.on('error',        msg            => broadcast({ type: 'error',  message: msg                    }))
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
}

function broadcast(data) {
  const msg = JSON.stringify(data)
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg)
  }
}