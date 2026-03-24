'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createSession, updateSession } from '@/lib/experiment'

type Variant = 'A' | 'B'
type Step = 1 | 2 | 3 | 4 | 5

// Placeholder variant images — replace with real landing page screenshots
const VARIANT_IMAGES: Record<Variant, string> = {
  A: 'https://placehold.co/1920x1080/1a1a2e/ffffff?text=Variant+A+Landing+Page',
  B: 'https://placehold.co/1920x1080/16213e/e0e0e0?text=Variant+B+Landing+Page',
}

const MULTIPLE_CHOICE_OPTIONS = ['Software Development', 'Fashion', 'Healthcare', 'Other']

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function ExperimentPage() {
  const [step, setStep] = useState<Step>(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [freeText, setFreeText] = useState('')
  const [countdown, setCountdown] = useState(10)
  const [shuffledOptions] = useState(() => shuffle(MULTIPLE_CHOICE_OPTIONS))

  // Save helper — fire-and-forget background update
  const save = useCallback(
    (updates: Parameters<typeof updateSession>[1]) => {
      if (!sessionId) return
      updateSession(sessionId, updates).catch(console.error)
    },
    [sessionId]
  )

  // Step 2: 10-second countdown then auto-advance
  useEffect(() => {
    if (step !== 2) return
    setCountdown(10)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          setStep(3)
          save({ highest_step_reached: 3 })
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step, save])

  async function handleStart() {
    const id = uuidv4()
    const v: Variant = Math.random() < 0.5 ? 'A' : 'B'
    setSessionId(id)
    setVariant(v)
    await createSession(id, v)
    updateSession(id, { highest_step_reached: 2 }).catch(console.error)
    setStep(2)
  }

  function handleFreeTextNext() {
    save({ free_text_answer: freeText, highest_step_reached: 4 })
    setStep(4)
  }

  function handleMultipleChoice(answer: string) {
    save({ multiple_choice_answer: answer, highest_step_reached: 5 })
    setStep(5)
  }

  // Full-screen exposure step — no chrome
  if (step === 2 && variant) {
    return (
      <div className="fixed inset-0 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={VARIANT_IMAGES[variant]}
          alt="Landing page variant"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-6 right-6 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full tabular-nums">
          {countdown}s
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {step === 1 && <IntroStep onStart={handleStart} />}
        {step === 3 && (
          <FreeTextStep
            value={freeText}
            onChange={setFreeText}
            onNext={handleFreeTextNext}
          />
        )}
        {step === 4 && (
          <MultipleChoiceStep
            options={shuffledOptions}
            onSelect={handleMultipleChoice}
          />
        )}
        {step === 5 && <ThankYouStep />}
      </div>
    </main>
  )
}

function IntroStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
          UX Research Study
        </p>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          Landing Page<br />Memory Test
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
          You&apos;ll be shown a company&apos;s landing page for 10 seconds, then asked a few
          short questions about what you remember.
        </p>
      </div>
      <p className="text-sm text-gray-400">
        Anonymous &bull; Takes about 2 minutes &bull; No sign-up required
      </p>
      <button
        onClick={onStart}
        className="w-full bg-gray-900 text-white py-4 px-8 rounded-xl text-base font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
      >
        Start Experiment
      </button>
    </div>
  )
}

function FreeTextStep({
  value,
  onChange,
  onNext,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
          Question 1 of 2
        </p>
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">
          Based on what you just saw, in which area of business is this company working?
        </h2>
        <p className="text-gray-400 text-sm">Describe in your own words — there are no wrong answers.</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here…"
        rows={5}
        className="w-full border border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base bg-white"
      />
      <button
        onClick={onNext}
        disabled={value.trim().length === 0}
        className="w-full bg-gray-900 text-white py-4 px-8 rounded-xl text-base font-semibold hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
      >
        Next
      </button>
    </div>
  )
}

function MultipleChoiceStep({
  options,
  onSelect,
}: {
  options: string[]
  onSelect: (answer: string) => void
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
          Question 2 of 2
        </p>
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">
          Which of the following best describes the company&apos;s industry?
        </h2>
        <p className="text-gray-400 text-sm">Select the option that fits best.</p>
      </div>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className="w-full text-left border border-gray-200 bg-white rounded-xl px-5 py-4 text-gray-800 font-medium hover:border-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function ThankYouStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">Thank you!</h2>
        <p className="text-gray-500 text-lg leading-relaxed max-w-xs mx-auto">
          Your responses have been recorded. You can close this tab now.
        </p>
      </div>
      <p className="text-xs text-gray-300">All data collected is anonymous.</p>
    </div>
  )
}
