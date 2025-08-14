"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Moon, Sun, RotateCcw, Volume2, VolumeX, Play, Trophy } from "lucide-react"

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

interface Level {
  number: number
  name: string
  bubbleCount: number
  minSize: number
  maxSize: number
  timeLimit: number
  theme: {
    background: string
    bubbleColors: string[]
    name: string
  }
  unlocks?: {
    soundEffect?: string
    bubbleSkin?: string
    message: string
  }
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

const levelCompletionMessages = [
  "Level Cleared! ✨",
  "You're a Bubble Boss! 💥",
  "Absolutely slaying! 🔥",
  "Main character energy! ⭐",
  "That was clean! 💯",
  "Bubble master unlocked! 👑",
  "Pure skill right there! 💪",
  "Chef's kiss performance! 👌",
  "Legendary pop session! 🏆",
  "Unstoppable force! ⚡",
]

const levels: Level[] = [
  {
    number: 1,
    name: "Chill Vibes",
    bubbleCount: 15,
    minSize: 60,
    maxSize: 80,
    timeLimit: 60,
    theme: {
      background: "from-pink-100 via-rose-100 to-pink-200",
      bubbleColors: ["from-pink-300 to-rose-400", "from-rose-300 to-pink-400", "from-pink-400 to-rose-500"],
      name: "Pastel Pink Dreams",
    },
  },
  {
    number: 2,
    name: "Ocean Breeze",
    bubbleCount: 20,
    minSize: 50,
    maxSize: 70,
    timeLimit: 50,
    theme: {
      background: "from-cyan-100 via-blue-100 to-teal-200",
      bubbleColors: ["from-cyan-300 to-blue-400", "from-blue-300 to-teal-400", "from-teal-300 to-cyan-400"],
      name: "Aqua Blue Waves",
    },
    unlocks: {
      soundEffect: "ocean",
      message: "Ocean sound effects unlocked! 🌊",
    },
  },
  {
    number: 3,
    name: "Neon Nights",
    bubbleCount: 25,
    minSize: 40,
    maxSize: 60,
    timeLimit: 45,
    theme: {
      background: "from-purple-200 via-violet-200 to-purple-300",
      bubbleColors: ["from-purple-400 to-violet-500", "from-violet-400 to-purple-500", "from-indigo-400 to-purple-500"],
      name: "Electric Purple Vibes",
    },
    unlocks: {
      bubbleSkin: "neon",
      message: "Neon bubble skins unlocked! ⚡",
    },
  },
  {
    number: 4,
    name: "Sunset Glow",
    bubbleCount: 30,
    minSize: 35,
    maxSize: 55,
    timeLimit: 40,
    theme: {
      background: "from-orange-100 via-yellow-100 to-red-200",
      bubbleColors: ["from-orange-400 to-red-500", "from-yellow-400 to-orange-500", "from-red-400 to-pink-500"],
      name: "Golden Hour Magic",
    },
  },
  {
    number: 5,
    name: "Cosmic Storm",
    bubbleCount: 35,
    minSize: 30,
    maxSize: 50,
    timeLimit: 35,
    theme: {
      background: "from-indigo-200 via-purple-200 to-blue-300",
      bubbleColors: ["from-indigo-500 to-purple-600", "from-purple-500 to-blue-600", "from-blue-500 to-indigo-600"],
      name: "Galactic Adventure",
    },
    unlocks: {
      soundEffect: "cosmic",
      bubbleSkin: "galaxy",
      message: "Cosmic effects & galaxy skins unlocked! 🌌",
    },
  },
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

  const [currentLevel, setCurrentLevel] = useState(1)
  const [gameState, setGameState] = useState<"menu" | "playing" | "levelComplete" | "gameOver">("menu")
  const [timeLeft, setTimeLeft] = useState(0)
  const [bubblesRemaining, setBubblesRemaining] = useState(0)
  const [showLevelIntro, setShowLevelIntro] = useState(false)
  const [completionMessage, setCompletionMessage] = useState("")
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([])
  const [confetti, setConfetti] = useState<Particle[]>([])

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playPopSound = useCallback(
    (soundType = "default") => {
      if (!soundEnabled || !audioContextRef.current) return

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Different sound profiles based on unlocked effects
      switch (soundType) {
        case "ocean":
          oscillator.frequency.setValueAtTime(600, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15)
          break
        case "cosmic":
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2)
          break
        default:
          oscillator.frequency.setValueAtTime(800, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
      }

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
    },
    [soundEnabled],
  )

  const generateBubbles = useCallback((levelNum: number) => {
    const level = levels[levelNum - 1]
    if (!level) return

    const newBubbles: Bubble[] = []
    const isMobile = window.innerWidth < 768
    const bubbleCount = isMobile ? Math.floor(level.bubbleCount * 0.7) : level.bubbleCount

    for (let i = 0; i < bubbleCount; i++) {
      newBubbles.push({
        id: i,
        x: Math.random() * 85 + 7.5, // More padding from edges
        y: Math.random() * 85 + 7.5,
        size: Math.random() * (level.maxSize - level.minSize) + level.minSize,
        color: level.theme.bubbleColors[Math.floor(Math.random() * level.theme.bubbleColors.length)],
        isPopping: false,
        shimmer: Math.random() > 0.6,
      })
    }
    setBubbles(newBubbles)
    setBubblesRemaining(bubbleCount)
  }, [])

  const startLevel = useCallback(
    (levelNum: number) => {
      const level = levels[levelNum - 1]
      if (!level) return

      setShowLevelIntro(true)
      setTimeout(() => {
        setShowLevelIntro(false)
        setGameState("playing")
        setTimeLeft(level.timeLimit)
        generateBubbles(levelNum)

        // Start timer
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setGameState("gameOver")
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, 2000)
    },
    [generateBubbles],
  )

  const completeLevel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const level = levels[currentLevel - 1]
    const message = levelCompletionMessages[Math.floor(Math.random() * levelCompletionMessages.length)]
    setCompletionMessage(message)

    // Create confetti
    const newConfetti: Particle[] = []
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: Date.now() + i,
        x: Math.random() * (gameAreaRef.current?.clientWidth || 800),
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        life: 120,
        maxLife: 120,
        color: ["#ff69b4", "#00bcd4", "#9c27b0", "#ff9800", "#4caf50"][Math.floor(Math.random() * 5)],
      })
    }
    setConfetti(newConfetti)

    // Check for unlocks
    if (level?.unlocks) {
      setUnlockedFeatures((prev) => [...prev, level.unlocks!.message])
    }

    setGameState("levelComplete")
    setScore((prev) => prev + timeLeft * 5) // Bonus points for remaining time
  }, [currentLevel, timeLeft])

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.5,
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0),
      )

      setConfetti((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.3,
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0),
      )
    }, 16)
    return () => clearInterval(interval)
  }, [])

  // Check level completion
  useEffect(() => {
    if (gameState === "playing" && bubblesRemaining === 0) {
      completeLevel()
    }
  }, [bubblesRemaining, gameState, completeLevel])

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

  const popBubble = useCallback(
    (bubbleId: number, event: React.MouseEvent | React.TouchEvent) => {
      if (gameState !== "playing") return

      const rect = gameAreaRef.current?.getBoundingClientRect()
      if (!rect) return

      const clientX = "touches" in event ? event.touches[0]?.clientX || event.changedTouches[0]?.clientX : event.clientX
      const clientY = "touches" in event ? event.touches[0]?.clientY || event.changedTouches[0]?.clientY : event.clientY

      const x = clientX - rect.left
      const y = clientY - rect.top

      setBubbles((prev) => prev.map((bubble) => (bubble.id === bubbleId ? { ...bubble, isPopping: true } : bubble)))

      createParticles(x, y, "#ff69b4")

      // Use level-appropriate sound effect
      const level = levels[currentLevel - 1]
      let soundType = "default"
      if (level?.unlocks?.soundEffect && unlockedFeatures.some((f) => f.includes(level.unlocks!.soundEffect!))) {
        soundType = level.unlocks.soundEffect
      }
      playPopSound(soundType)

      setScore((prev) => prev + 10 * currentLevel) // More points for higher levels
      setStreak((prev) => {
        const newStreak = prev + 1
        if (newStreak > bestStreak) {
          setBestStreak(newStreak)
        }

        if (newStreak % 5 === 0) {
          const quote = popQuotes[Math.floor(Math.random() * popQuotes.length)]
          setCurrentQuote(quote)
          setShowQuote(true)
          setTimeout(() => setShowQuote(false), 2000)
        }

        return newStreak
      })

      setTimeout(() => {
        setBubbles((prev) => prev.filter((bubble) => bubble.id !== bubbleId))
        setBubblesRemaining((prev) => prev - 1)
      }, 300)
    },
    [createParticles, playPopSound, bestStreak, gameState, currentLevel, unlockedFeatures],
  )

  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setScore(0)
    setStreak(0)
    setCurrentLevel(1)
    setGameState("menu")
    setTimeLeft(0)
    setBubblesRemaining(0)
    setCurrentQuote("")
    setShowQuote(false)
    setParticles([])
    setConfetti([])
    setBubbles([])
  }, [])

  const nextLevel = useCallback(() => {
    if (currentLevel < levels.length) {
      setCurrentLevel((prev) => prev + 1)
      startLevel(currentLevel + 1)
    } else {
      // Game completed!
      setGameState("menu")
    }
  }, [currentLevel, startLevel])

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newTheme = !prev
      document.documentElement.classList.toggle("dark", newTheme)
      return newTheme
    })
  }, [])

  const currentLevelData = levels[currentLevel - 1]

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDark
          ? "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
          : gameState === "playing" && currentLevelData
            ? `bg-gradient-to-br ${currentLevelData.theme.background}`
            : "bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-2 flex-wrap">
          <Card className="px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="text-sm font-medium">Score: {score}</div>
          </Card>
          <Card className="px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="text-sm font-medium">Level: {currentLevel}</div>
          </Card>
          {gameState === "playing" && (
            <>
              <Card className="px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="text-sm font-medium">Time: {timeLeft}s</div>
              </Card>
              <Card className="px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="text-sm font-medium">Bubbles: {bubblesRemaining}</div>
              </Card>
            </>
          )}
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
        <p className="text-lg text-muted-foreground">
          {gameState === "playing" && currentLevelData
            ? `${currentLevelData.name} - ${currentLevelData.theme.name}`
            : "Pop bubbles, level up, feel the vibes ✨"}
        </p>
      </div>

      {/* Level Intro */}
      {showLevelIntro && currentLevelData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-center animate-bounce">
            <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Level {currentLevel}
            </div>
            <div className="text-xl font-semibold mb-2">{currentLevelData.name}</div>
            <div className="text-lg text-muted-foreground mb-4">{currentLevelData.theme.name}</div>
            <div className="text-sm text-muted-foreground">
              Pop {currentLevelData.bubbleCount} bubbles in {currentLevelData.timeLimit} seconds!
            </div>
          </Card>
        </div>
      )}

      {/* Quote Display */}
      {showQuote && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 animate-bounce">
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
        className="relative mx-4 h-[60vh] rounded-2xl overflow-hidden bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10"
        style={{ touchAction: "manipulation" }}
      >
        {/* Menu State */}
        {gameState === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center max-w-md">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <div className="text-2xl font-bold mb-4">Ready to Pop?</div>
              <div className="text-lg text-muted-foreground mb-6">
                Progress through {levels.length} unique levels with increasing difficulty!
              </div>
              <Button
                onClick={() => startLevel(currentLevel)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 mb-4"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Level {currentLevel}
              </Button>
              {bestStreak > 0 && (
                <div className="text-sm text-muted-foreground">
                  Best Streak: {bestStreak} | High Score: {score}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Level Complete State */}
        {gameState === "levelComplete" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center max-w-md">
              <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                {completionMessage}
              </div>
              <div className="text-lg text-muted-foreground mb-4">Level {currentLevel} Complete!</div>
              <div className="text-sm text-muted-foreground mb-6">
                Score: {score} | Time Bonus: {timeLeft * 5} points
              </div>
              {currentLevelData?.unlocks && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-lg">
                  <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    🎉 {currentLevelData.unlocks.message}
                  </div>
                </div>
              )}
              {currentLevel < levels.length ? (
                <Button
                  onClick={nextLevel}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  size="lg"
                >
                  Next Level
                </Button>
              ) : (
                <div>
                  <div className="text-xl font-bold mb-4">🏆 Game Complete! 🏆</div>
                  <Button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    Play Again
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Game Over State */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold mb-4">Time's Up! ⏰</div>
              <div className="text-lg text-muted-foreground mb-4">Final Score: {score}</div>
              <div className="flex gap-4">
                <Button
                  onClick={() => startLevel(currentLevel)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Retry Level
                </Button>
                <Button onClick={resetGame} variant="outline" className="bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                  Main Menu
                </Button>
              </div>
            </Card>
          </div>
        )}

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
              <div className="absolute top-2 left-2 w-3 h-3 bg-white/60 rounded-full blur-sm" />
              <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />
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

        {/* Confetti */}
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              backgroundColor: particle.color,
              opacity: particle.life / particle.maxLife,
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center mt-6 px-4">
        <p className="text-sm text-muted-foreground">
          {gameState === "playing"
            ? "Pop all bubbles before time runs out! • Build streaks for bonus quotes"
            : "Progress through levels with unique themes • Unlock special effects and sounds"}
        </p>
      </div>
    </div>
  )
}
