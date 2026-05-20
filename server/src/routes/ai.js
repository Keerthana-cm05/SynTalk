import express    from 'express'
import Anthropic  from '@anthropic-ai/sdk'

const router     = express.Router()
const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/ai/suggest
router.post('/suggest', async (req, res) => {
  try {
    const { partial } = req.body
    if (!partial?.trim()) return res.json({ suggestions: [] })

    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role:    'user',
        content: `You help a mute person communicate using sign language.
They signed: "${partial.trim()}"
Give exactly 5 short natural completions for what they want to say next.
Respond ONLY with a JSON array of 5 strings. No explanation. No markdown.
Example: ["water","help","a moment","to go home","medicine"]`,
      }],
    })

    const raw   = msg.content[0].text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    const list  = JSON.parse(clean)
    res.json({ suggestions: Array.isArray(list) ? list.slice(0,5) : [] })
  } catch (e) {
    console.error('AI suggest:', e.message)
    res.json({ suggestions: [] })
  }
})

// POST /api/ai/complete
router.post('/complete', async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.json({ completed: '' })

    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role:    'user',
        content: `A mute person signed: "${text.trim()}"
Complete this into one clear natural polite sentence.
Respond ONLY with the sentence. No quotes. No explanation.`,
      }],
    })

    res.json({ completed: msg.content[0].text.trim() })
  } catch (e) {
    console.error('AI complete:', e.message)
    res.json({ completed: req.body.text || '' })
  }
})

export default router