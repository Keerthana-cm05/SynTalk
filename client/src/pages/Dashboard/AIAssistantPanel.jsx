import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Trash2, RotateCcw, Plus } from 'lucide-react'
import { useAISuggest, completeText } from '../../hooks/useAISuggest'
import { useTTS } from '../../hooks/useTTS'
import AISuggestBar from '../../components/ui/AISuggestBar'
import ConversationLog from '../../components/ui/ConversationLog'
import TTSControls from '../../components/ui/TTSControls'

let entryCounter = 0

export default function AIAssistantPanel({ currentGestureText = '', mode = 'hardware' }) {
  const [inputText, setInputText]         = useState(currentGestureText)
  const [conversation, setConversation]   = useState([])
  const [completing, setCompleting]       = useState(false)
  const { suggestions, loading, getSuggestions, clearSuggestions } = useAISuggest()
  const tts = useTTS()

  // When user types or gesture text changes
  function handleInputChange(e) {
    const val = e.target.value
    setInputText(val)
    if (val.trim().length >= 2) {
      getSuggestions(val)
    } else {
      clearSuggestions()
    }
  }

  // When user picks an AI suggestion chip
  function handleSuggestionSelect(suggestion) {
    const newText = inputText.trim()
      ? `${inputText.trim()} ${suggestion}`
      : suggestion
    setInputText(newText)
    clearSuggestions()
    // Get next suggestions
    getSuggestions(newText)
  }

  // Send current text to conversation
  function handleSend() {
    if (!inputText.trim()) return
    const entry = {
      id: ++entryCounter,
      text: inputText.trim(),
      timestamp: Date.now(),
      confidence: 0,
      mode,
    }
    setConversation(prev => [...prev, entry])
    tts.speak(entry.text)
    setInputText('')
    clearSuggestions()
  }

  // AI complete button — expand partial into full sentence
  async function handleAIComplete() {
    if (!inputText.trim()) return
    setCompleting(true)
    try {
      const completed = await completeText(inputText)
      setInputText(completed)
      clearSuggestions()
      getSuggestions(completed)
    } finally {
      setCompleting(false)
    }
  }

  function handleClearAll() {
    setConversation([])
    setInputText('')
    clearSuggestions()
  }

  // Allow Enter to send
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg glass border border-accent/20 flex items-center justify-center">
            <Sparkles size={13} className="text-accent-light" />
          </div>
          <div>
            <h3 className="text-sm font-body font-medium text-text-primary">AI Assistant</h3>
            <p className="text-[10px] font-mono text-text-muted">Sentence completion + TTS</p>
          </div>
        </div>
        {conversation.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-300
              transition-colors glass border border-white/5 px-2.5 py-1.5 rounded-lg"
          >
            <Trash2 size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Conversation Log */}
      <ConversationLog entries={conversation} onSpeak={tts.speak} />

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Input area */}
      <div className="flex flex-col gap-3">
        {/* Text area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing or use gesture input…"
            rows={3}
            className="w-full glass rounded-xl px-4 py-3 text-sm font-body text-text-primary
              placeholder:text-text-muted border border-white/8 focus:border-accent/40
              focus:ring-1 focus:ring-accent/15 outline-none resize-none
              transition-all duration-200 leading-relaxed"
          />
          {/* Character count */}
          <span className="absolute bottom-3 right-3 text-[10px] font-mono text-text-muted">
            {inputText.length}
          </span>
        </div>

        {/* AI Suggestion bar */}
        <AISuggestBar
          suggestions={suggestions}
          loading={loading}
          onSelect={handleSuggestionSelect}
          partial={inputText}
        />

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Complete */}
          <button
            onClick={handleAIComplete}
            disabled={!inputText.trim() || completing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body
              glass border border-accent/20 text-accent-light hover:bg-accent/10
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {completing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RotateCcw size={12} />
                </motion.div>
                Completing...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                AI Complete
              </>
            )}
          </button>

          {/* New line */}
          <button
            onClick={() => setInputText(prev => prev + '\n')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body
              glass border border-white/8 text-text-muted hover:text-text-secondary
              transition-all duration-200"
          >
            <Plus size={12} />
            New line
          </button>

          {/* TTS Controls */}
          <TTSControls tts={tts} text={inputText} />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm
              font-medium bg-accent hover:bg-accent-light disabled:opacity-40
              disabled:cursor-not-allowed transition-all duration-200 text-white
              shadow-md shadow-accent/20"
          >
            <Send size={13} />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}