import express from 'express'
import { gloveSerial } from '../config/serial.js'

const router = express.Router()

router.get('/ports', async (req, res) => {
  const ports = await gloveSerial.listPorts()
  res.json({ ports })
})

router.post('/connect', async (req, res) => {
  const { port, baudRate = 9600 } = req.body
  if (!port) return res.status(400).json({ error: 'port required' })
  try {
    await gloveSerial.connect(port, Number(baudRate))
    res.json({ ok: true, port })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/disconnect', async (req, res) => {
  await gloveSerial.disconnect()
  res.json({ ok: true })
})

router.get('/status', (req, res) => {
  res.json({ connected: gloveSerial.connected, port: gloveSerial.portPath })
})

export default router