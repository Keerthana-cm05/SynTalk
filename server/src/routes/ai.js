import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = express.Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/ai/suggest
// Body: { partial: "I need" }
// Returns: { suggestions: ["water", "help", "a doctor", "to sit down", "medicine"] }
router.post('/suggest', async (req, res) => {
  try {
    const { partial } = req.body
    if (!partial || !partial.trim()) {
      return res.json({ suggestions: [] })
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: `You are an AI assistant helping a mute person communicate using sign language.
They have signed the beginning of a sentence: "${partial.trim()}"
Suggest exactly 5 short, natural completions for what they might want to say next.
Each suggestion should be just the CONTINUATION (not the full sentence).
Respond ONLY with a JSON array of 5 strings. No explanation. No markdown.
Example format: ["water","help","a moment","to go home","medicine"]`,
        },
      ],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const suggestions = JSON.parse(cleaned)
    res.json({ suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 5) : [] })
  } catch (err) {
    console.error('AI suggest error:', err.message)
    res.status(500).json({ suggestions: [], error: err.message })
  }
})

// POST /api/ai/complete
// Body: { text: "I need water" }
// Returns: { completed: "I need water please." }
router.post('/complete', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || !text.trim()) {
      return res.json({ completed: '' })
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: `A mute person using sign language has communicated: "${text.trim()}"
Complete this into one clear, natural, polite sentence.
Respond ONLY with the completed sentence. No explanation. No quotes.`,
        },
      ],
    })

    const completed = message.content[0].text.trim()
    res.json({ completed })
  } catch (err) {
    console.error('AI complete error:', err.message)
    res.status(500).json({ completed: '', error: err.message })
  }
})

export default router