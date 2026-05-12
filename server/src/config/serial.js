import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { EventEmitter } from 'events'

class GloveSerial extends EventEmitter {
  constructor() {
    super()
    this.port      = null
    this.parser    = null
    this.connected = false
    this.portPath  = null
  }

  async listPorts() {
    try {
      const ports = await SerialPort.list()
      console.log('Ports found:', ports.map(p => p.path))
      return ports.map(p => ({
        path:         p.path,
        manufacturer: p.manufacturer || '',
        vendorId:     p.vendorId     || '',
        friendlyName: p.friendlyName || p.path,
        isArduino:    this._isArduino(p),
      }))
    } catch (err) {
      console.error('listPorts error:', err)
      return []
    }
  }

  _isArduino(port) {
    const c = s => (s || '').toLowerCase()
    return (
      c(port.manufacturer).includes('arduino') ||
      c(port.manufacturer).includes('ch340')   ||
      c(port.manufacturer).includes('ch341')   ||
      c(port.manufacturer).includes('ftdi')    ||
      c(port.manufacturer).includes('wch')     ||
      port.vendorId === '2341' ||
      port.vendorId === '1a86' ||
      port.vendorId === '0403'
    )
  }

  // Parse Arduino line — return RAW integer values 0-1023
  _parseLine(line) {
    const trimmed = line.trim()
    if (!trimmed) return null

    // JSON format: {"f":[0.0,0.12,0.45,0.67,0.23],"a":[0,0,1]}
    if (trimmed.startsWith('{')) {
      try {
        const data = JSON.parse(trimmed)
        if (Array.isArray(data.f) && data.f.length >= 5) {
          // Already normalized 0-1 — pass through as-is
          // Multiply by 1000 to treat as "raw" so frontend calibrator works
          return {
            raw:    data.f.slice(1, 5).map(v => Math.round(v * 1000)),
            isNorm: true,
          }
        }
      } catch { /* fall through */ }
    }

    // CSV format: "312,456,523,498" — 4 raw ADC values
    const csvParts = trimmed.split(',').map(s => s.trim())
    if (csvParts.length === 4 && csvParts.every(p => /^\d+$/.test(p))) {
      return { raw: csvParts.map(Number), isNorm: false }
    }

    // Labeled format: "Index: 312  Middle: 456  Ring: 523  Pinky: 498"
    const iM = trimmed.match(/I(?:ndex)?[:\s]+(\d+)/i)
    const mM = trimmed.match(/M(?:iddle)?[:\s]+(\d+)/i)
    const rM = trimmed.match(/R(?:ing)?[:\s]+(\d+)/i)
    const pM = trimmed.match(/P(?:inky)?[:\s]+(\d+)/i)
    if (iM && mM && rM && pM) {
      return {
        raw: [parseInt(iM[1]), parseInt(mM[1]), parseInt(rM[1]), parseInt(pM[1])],
        isNorm: false,
      }
    }

    return null
  }

  async connect(portPath, baudRate = 9600) {
    if (this.connected) await this.disconnect()

    return new Promise((resolve, reject) => {
      console.log(`Opening ${portPath} at ${baudRate} baud`)

      const port   = new SerialPort({ path: portPath, baudRate, autoOpen: false })
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

      port.open(err => {
        if (err) {
          reject(new Error(`Cannot open ${portPath}: ${err.message}`))
          return
        }
        this.port      = port
        this.parser    = parser
        this.connected = true
        this.portPath  = portPath
        console.log(`✅ ${portPath} opened`)
        this.emit('connected', { portPath })
        resolve({ portPath })
      })

      parser.on('data', line => {
        const parsed = this._parseLine(line)
        if (!parsed) return
        this.emit('sensorData', {
          raw:    parsed.raw,      // [index, middle, ring, pinky] raw ADC
          isNorm: parsed.isNorm,   // true if already 0-1
          ts:     Date.now(),
        })
      })

      port.on('close', () => {
        this.connected = false
        this.portPath  = null
        this.emit('disconnected')
      })

      port.on('error', err => {
        this.connected = false
        this.emit('error', err.message)
      })
    })
  }

  async disconnect() {
    return new Promise(resolve => {
      if (!this.port || !this.port.isOpen) {
        this.connected = false
        this.port      = null
        resolve()
        return
      }
      this.port.close(err => {
        if (err) console.error('Close error:', err.message)
        this.connected = false
        this.port      = null
        this.portPath  = null
        resolve()
      })
    })
  }
}

export const gloveSerial = new GloveSerial()