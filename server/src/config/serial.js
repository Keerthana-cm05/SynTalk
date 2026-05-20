import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { EventEmitter } from 'events'

class GloveSerial extends EventEmitter {
  constructor() {
    super()
    this.port      = null
    this.connected = false
    this.portPath  = null
    this.frameCount = 0
  }

  async listPorts() {
    try {
      const list = await SerialPort.list()
      console.log('Ports:', list.map(p => `${p.path}[${p.manufacturer||'?'}]`))
      return list.map(p => ({
        path:      p.path,
        manufacturer: p.manufacturer || '',
        isArduino: /arduino|ch340|ch341|ftdi|wch/i.test(p.manufacturer||'') ||
                   ['2341','1a86','0403'].includes(p.vendorId||''),
      }))
    } catch (e) {
      console.error('listPorts:', e.message)
      return []
    }
  }

  async connect(path, baud = 9600) {
    // If already connected to same port, just emit connected
    if (this.connected && this.portPath === path) {
      this.emit('connected', { portPath: path })
      return { portPath: path }
    }
    // Disconnect existing connection first
    if (this.connected) await this.disconnect()

    return new Promise((resolve, reject) => {
      console.log(`Opening ${path} @ ${baud}...`)
      const port = new SerialPort({ path, baudRate: baud, autoOpen: false })

      port.open(err => {
        if (err) { reject(new Error(err.message)); return }
        console.log(`✅ ${path} opened`)

        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

        parser.on('data', rawLine => {
          const line = rawLine.toString().trim()
          if (!line) return

          this.frameCount++

          // Log first 5 frames so we can see the format
          if (this.frameCount <= 5) {
            console.log(`Frame ${this.frameCount} raw:`, JSON.stringify(line))
          }

          const parsed = this._parse(line)
          if (parsed) {
            if (this.frameCount <= 5) {
              console.log(`Frame ${this.frameCount} parsed:`, parsed.raw)
            }
            this.emit('sensorData', parsed)
          } else if (this.frameCount <= 5) {
            console.log(`Frame ${this.frameCount} NOT PARSED`)
          }
        })

        port.on('close', () => {
          console.log(`${path} closed`)
          this.connected  = false
          this.portPath   = null
          this.port       = null
          this.frameCount = 0
          this.emit('disconnected')
        })

        port.on('error', e => {
          console.error('Port error:', e.message)
          this.connected = false
          this.emit('error', e.message)
        })

        this.port      = port
        this.connected = true
        this.portPath  = path
        this.emit('connected', { portPath: path })
        resolve({ portPath: path })
      })
    })
  }

  async disconnect() {
    return new Promise(resolve => {
      if (!this.port || !this.port.isOpen) {
        this.connected  = false
        this.port       = null
        this.frameCount = 0
        resolve()
        return
      }
      this.port.close(() => {
        this.connected  = false
        this.port       = null
        this.portPath   = null
        this.frameCount = 0
        resolve()
      })
    })
  }

  _parse(line) {
    if (!line || line.length === 0) return null

    // ── FORMAT 1: JSON ─────────────────────────────────────────
    // {"f":[0,0.12,0.45,0.67,0.23]}
    if (line.startsWith('{')) {
      try {
        const d = JSON.parse(line)
        if (Array.isArray(d.f) && d.f.length >= 5) {
          const raw = d.f.slice(1, 5).map(v => Math.round(Number(v) * 1000))
          return { raw, alreadyNorm: true }
        }
      } catch {}
    }

    // ── FORMAT 2: Pure CSV "312,456,523,498" ───────────────────
    if (line.includes(',')) {
      const parts = line.split(',').map(s => s.replace(/[^0-9]/g, '').trim())
      const nums  = parts.map(Number).filter(n => !isNaN(n) && n > 0)
      if (nums.length === 4) {
        return { raw: nums, alreadyNorm: false }
      }
      // Sometimes 5 values if thumb included
      if (nums.length === 5) {
        return { raw: nums.slice(1, 5), alreadyNorm: false }
      }
    }

    // ── FORMAT 3: "Index: 312  Middle: 456  Ring: 523  Pinky: 498" ──
    // Extract number after each keyword
    const extractNum = (key) => {
      const m = line.match(new RegExp(key + '[^0-9]*(\\d+)', 'i'))
      return m ? parseInt(m[1]) : null
    }

    const i = extractNum('Index') ?? extractNum('I')
    const m = extractNum('Middle') ?? extractNum('M')
    const r = extractNum('Ring') ?? extractNum('R')
    const p = extractNum('Pinky') ?? extractNum('P')

    if (i !== null && m !== null && r !== null && p !== null) {
      return { raw: [i, m, r, p], alreadyNorm: false }
    }

    // ── FORMAT 4: Any 4 numbers separated by spaces or tabs ────
    const tokens = line.split(/[\s\t,]+/).map(s => s.replace(/[^0-9]/g, ''))
    const valid  = tokens.filter(s => s.length > 0).map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 1023)
    if (valid.length === 4) {
      return { raw: valid, alreadyNorm: false }
    }
    if (valid.length === 5) {
      return { raw: valid.slice(1, 5), alreadyNorm: false }
    }

    return null
  }
}

export const gloveSerial = new GloveSerial()