import express from 'express'
import { gloveSerial } from '../config/serial.js'

const router = express.Router()

router.get('/ports', async (req, res) => {
  try {
    const ports = await gloveSerial.listPorts()
    console.log(`Found ${ports.length} port(s):`, ports.map(p => p.path))
    res.json({ ports })
  } catch (err) {
    res.status(500).json({ error: err.message, ports: [] })
  }
})

router.get('/ports/arduino', async (req, res) => {
  try {
    const all     = await gloveSerial.listPorts()
    const arduino = all.filter(p => p.isArduino)
    res.json({ ports: arduino, all })
  } catch (err) {
    res.status(500).json({ error: err.message, ports: [] })
  }
})

// Connect — uses 9600 baud to match Arduino code
router.post('/connect', async (req, res) => {
  const { port, baudRate = 9600 } = req.body
  if (!port) return res.status(400).json({ error: 'port is required' })
  try {
    await gloveSerial.connect(port, baudRate)
    res.json({ success: true, port })
  } catch (err) {
    console.error('Connect error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/disconnect', async (req, res) => {
  try {
    await gloveSerial.disconnect()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/status', (req, res) => {
  res.json({
    connected: gloveSerial.connected,
    port:      gloveSerial.portPath || null,
  })
})

export default router