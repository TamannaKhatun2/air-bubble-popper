"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Moon, Sun, RotateCcw, Volume2, VolumeX } from "lucide-react"

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: string
  isPopping: boolean
  shimmer: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

const popQuotes = [
  "Pop therapy unlocked! 😌",
  "So satisfying ✨",
  "Stress = gone 💫",
  "That hit different 🔥",
  "Pure vibes only 🌈",
  "Bubble slayer mode 💪",
  "Zen achieved 🧘‍♀️",
  "Chef's kiss 👌",
  "Main character energy ⭐",
  "No cap, that was clean 💯",
]

const bubbleColors = [
  "from-pink-300 to-purple-400",
  "from-blue-300 to-cyan-400",
  "from-green-300 to-teal-400",
  "from-yellow-300 to-orange-400",
  "from-purple-300 to-pink-400",
  "from-cyan-300 to-blue-400",
  "from-teal-300 to-green-400",
  "from-orange-300 to-red-400",
  "from-indigo-300 to-purple-400",
  "from-rose-300 to-pink-400",
]

export default function AirBubblePopper() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentQuote, setCurrentQuote] = useState("")
  const [showQuote, setShowQuote] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  // Generate ASMR pop sound
  const playPopSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }, [soundEnabled])

  // Generate initial bubbles
  const generateBubbles = useCallback(() => {
    const newBubbles: Bubble[] = []
    const bubbleCount = window.innerWidth < 768 ? 20 : 35

    for (let i = 0; i < bubbleCount; i++) {
      newBubbles.push({
        id: i,
        x: Math.random() * 90 + 5, // 5% to 95% to avoid edges
        y: Math.random() * 90 + 5,
        size: Math.random() * 40 + 40, // 40px to 80px
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        isPopping: false,
        shimmer: Math.random() > 0.5,
      })
    }
    setBubbles(newBubbles)
  }, [])

  // Initialize game
  useEffect(() => {
    generateBubbles()
  }, [generateBubbles])

  // Shimmer animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) =>
        prev.map((bubble) => ({
          ...bubble,
          shimmer: Math.random() > 0.7,
        })),
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Particle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.5, // gravity
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0),
      )
    }, 16)
    return () => clearInterval(interval)
  }, [])

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 30,
        maxLife: 30,
        color,
      })
    }
    setParticles((prev) => [...prev, ...newParticles])
  }, [])

  // Pop bubble
  const popBubble = useCallback(
    (bubbleId: number, event: React.MouseEvent | React.TouchEvent) => {
      const rect = gameAreaRef.current?.getBoundingClientRect()
      if (!rect) return

      const clientX = "touches" in event ? event.touches[0]?.clientX || event.changedTouches[0]?.clientX : event.clientX
      const clientY = "touches" in event ? event.touches[0]?.clientY || event.changedTouches[0]?.clientY : event.clientY

      const x = clientX - rect.left
      const y = clientY - rect.top

      setBubbles((prev) => prev.map((bubble) => (bubble.id === bubbleId ? { ...bubble, isPopping: true } : bubble)))

      // Create particles at click/touch position
      createParticles(x, y, "#ff69b4")

      playPopSound()
      setScore((prev) => prev + 10)
      setStreak((prev) => {
        const newStreak = prev + 1
        if (newStreak > bestStreak) {
          setBestStreak(newStreak)
        }

        // Show quote on streak milestones
        if (newStreak % 5 === 0) {
          const quote = popQuotes[Math.floor(Math.random() * popQuotes.length)]
          setCurrentQuote(quote)
          setShowQuote(true)
          setTimeout(() => setShowQuote(false), 2000)
        }

        return newStreak
      })

      // Remove bubble after animation
      setTimeout(() => {
        setBubbles((prev) => prev.filter((bubble) => bubble.id !== bubbleId))
      }, 300)
    },
    [createParticles, playPopSound, bestStreak],
  )

  // Reset game
  const resetGame = useCallback(() => {
    setScore(0)
    setStreak(0)
    setCurrentQuote("")
    setShowQuote(false)
    setParticles([])
    generateBubbles()
  }, [generateBubbles])

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newTheme = !prev
      document.documentElement.classList.toggle("dark", newTheme)
      return newTheme
    })
  }, [])

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${isDark ? "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" : "bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-4">
          <Card className="px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="text-sm font-medium">Score: {score}</div>
          </Card>
          <Card className="px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="text-sm font-medium">Streak: {streak}</div>
          </Card>
          <Card className="px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="text-sm font-medium">Best: {bestStreak}</div>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/80 dark:bg-black/80 backdrop-blur-sm"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="bg-white/80 dark:bg-black/80 backdrop-blur-sm"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetGame}
            className="bg-white/80 dark:bg-black/80 backdrop-blur-sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2">
          Air Bubble Popper
        </h1>
        <p className="text-lg text-muted-foreground">Pop bubbles, feel the vibes ✨</p>
      </div>

      {/* Quote Display */}
      {showQuote && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
          <Card className="px-6 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-2 border-pink-300 dark:border-pink-600">
            <div className="text-xl font-bold text-center bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {currentQuote}
            </div>
          </Card>
        </div>
      )}

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="relative mx-4 h-[70vh] rounded-2xl overflow-hidden bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10"
        style={{ touchAction: "manipulation" }}
      >
        {/* Bubbles */}
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`absolute cursor-pointer select-none transition-all duration-300 ${
              bubble.isPopping ? "animate-ping opacity-0 scale-150" : "hover:scale-110 active:scale-95"
            } ${bubble.shimmer ? "animate-pulse" : ""}`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => !bubble.isPopping && popBubble(bubble.id, e)}
            onTouchStart={(e) => {
              e.preventDefault()
              !bubble.isPopping && popBubble(bubble.id, e)
            }}
          >
            <div
              className={`w-full h-full rounded-full bg-gradient-to-br ${bubble.color} shadow-lg border-2 border-white/30 backdrop-blur-sm relative overflow-hidden`}
            >
              {/* Glossy highlight */}
              <div className="absolute top-2 left-2 w-3 h-3 bg-white/60 rounded-full blur-sm" />
              <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />

              {/* Shimmer effect */}
              {bubble.shimmer && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>
        ))}

        {/* Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full pointer-events-none"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              backgroundColor: particle.color,
              opacity: particle.life / particle.maxLife,
            }}
          />
        ))}

        {/* Empty state */}
        {bubbles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold mb-4">All bubbles popped! 🎉</div>
              <div className="text-lg text-muted-foreground mb-4">
                Final Score: {score} | Best Streak: {bestStreak}
              </div>
              <Button
                onClick={resetGame}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Pop More Bubbles
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center mt-6 px-4">
        <p className="text-sm text-muted-foreground">
          Tap or click bubbles to pop them • Build streaks for bonus quotes • Toggle sound and theme above
        </p>
      </div>
    </div>
  )
}
