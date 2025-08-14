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
  timeLimit?: number
  theme: {
    background: string
    bubbleColors: string[]
    name: string
  }
  unlocks?: {
    soundEffect?: string
    bubbleSkin?: string
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
    theme: {
      background: "from-pink-100 via-rose-100 to-pink-200",
      bubbleColors: ["from-pink-300 to-rose-400", "from-rose-300 to-pink-400"],
      name: "Pastel Pink Dreams",
    },
  },
  {
    number: 2,
    name: "Ocean Breeze",
    bubbleCount: 20,
    minSize: 50,
    maxSize: 70,
    timeLimit: 60,
    theme: {
      background: "from-cyan-100 via-blue-100 to-teal-200",
      bubbleColors: ["from-cyan-300 to-blue-400", "from-blue-300 to-teal-400"],
      name: "Aqua Blue Waves",
    },
    unlocks: {
      soundEffect: "ocean",
    },
  },
  {
    number: 3,
    name: "Neon Dreams",
    bubbleCount: 25,
    minSize: 40,
    maxSize: 60,
    timeLimit: 50,
    theme: {
      background: "from-purple-200 via-violet-200 to-purple-300",
      bubbleColors: ["from-purple-400 to-violet-500", "from-violet-400 to-purple-500"],
      name: "Electric Purple",
    },
    unlocks: {
      bubbleSkin: "neon",
    },
  },
  {
    number: 4,
    name: "Sunset Glow",
    bubbleCount: 30,
    minSize: 35,
    maxSize: 55,
    timeLimit: 45,
    theme: {
      background: "from-orange-200 via-yellow-200 to-red-200",
      bubbleColors: ["from-orange-400 to-red-500", "from-yellow-400 to-orange-500"],
      name: "Golden Hour",
    },
  },
  {
    number: 5,
    name: "Cosmic Challenge",
    bubbleCount: 35,
    minSize: 30,
    maxSize: 50,
    timeLimit: 40,
    theme: {
      background: "from-indigo-300 via-purple-300 to-pink-300",
      bubbleColors: ["from-indigo-500 to-purple-600", "from-purple-500 to-pink-600"],
      name: "Galaxy Vibes",
    },
    unlocks: {
      soundEffect: "cosmic",
      bubbleSkin: "galaxy",
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
  const [gameState, setGameState] = useState<"menu" | "playing" | "levelComplete" | "gameComplete">("menu")
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [bubblesRemaining, setBubblesRemaining] = useState(0)
  const [showLevelIntro, setShowLevelIntro] = useState(false)
  const [completionMessage, setCompletionMessage] = useState("")
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([])
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

  const generateBubbles = useCallback((levelNumber: number) => {
    const level = levels[levelNumber - 1]
    if (!level) return

    const newBubbles: Bubble[] = []
    const bubbleCount = window.innerWidth < 768 ? Math.max(level.bubbleCount - 5, 10) : level.bubbleCount

    for (let i = 0; i < bubbleCount; i++) {
      const colorIndex = Math.floor(Math.random() * level.theme.bubbleColors.length)
      newBubbles.push({
        id: i,
        x: Math.random() * 85 + 7.5, // More padding for smaller bubbles
        y: Math.random() * 85 + 7.5,
        size: Math.random() * (level.maxSize - level.minSize) + level.minSize,
        color: level.theme.bubbleColors[colorIndex],
        isPopping: false,
        shimmer: Math.random() > 0.5,
      })
    }
    setBubbles(newBubbles)
    setBubblesRemaining(newBubbles.length)
  }, [])

  const completeLevel = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
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
      const newUnlocks: string[] = []
      if (level.unlocks.soundEffect) newUnlocks.push(`Sound: ${level.unlocks.soundEffect}`)
      if (level.unlocks.bubbleSkin) newUnlocks.push(`Skin: ${level.unlocks.bubbleSkin}`)
      setUnlockedRewards((prev) => [...prev, ...newUnlocks])
    }

    // Bonus score for completing level
    setScore((prev) => prev + currentLevel * 100)

    if (currentLevel >= levels.length) {
      setGameState("gameComplete")
    } else {
      setGameState("levelComplete")
    }
  }

  const resetGame = useCallback(() => {
    setScore(0)
    setStreak(0)
    setCurrentQuote("")
    setShowQuote(false)
    setParticles([])
    setConfetti([])
    setCurrentLevel(1)
    setGameState("menu")
    setTimeLeft(null)
    setBubblesRemaining(0)
    setCompletionMessage("")
    setBubbles([])

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startLevel = useCallback(
    (levelNumber: number) => {
      const level = levels[levelNumber - 1]
      if (!level) return

      setCurrentLevel(levelNumber)
      setShowLevelIntro(true)
      setGameState("playing")

      // Show level intro animation
      setTimeout(() => {
        setShowLevelIntro(false)
        generateBubbles(levelNumber)

        // Start timer if level has time limit
        if (level.timeLimit) {
          setTimeLeft(level.timeLimit)
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev === null || prev <= 1) {
                // Time's up - game over
                setGameState("menu")
                resetGame()
                return null
              }
              return prev - 1
            })
          }, 1000)
        }
      }, 2000)
    },
    [generateBubbles, resetGame],
  )

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

      // Use unlocked sound effects
      const level = levels[currentLevel - 1]
      const soundType = level?.unlocks?.soundEffect || "default"
      playPopSound(soundType)

      setScore((prev) => prev + 10 * currentLevel) // More points for higher levels
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

      // Remove bubble after animation and check level completion
      setTimeout(() => {
        setBubbles((prev) => {
          const newBubbles = prev.filter((bubble) => bubble.id !== bubbleId)
          setBubblesRemaining(newBubbles.length)

          // Check if level is complete
          if (newBubbles.length === 0 && gameState === "playing") {
            setTimeout(() => completeLevel(), 500)
          }

          return newBubbles
        })
      }, 300)
    },
    [createParticles, playPopSound, bestStreak, currentLevel, gameState],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.3, // gravity
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0),
      )
    }, 16)
    return () => clearInterval(interval)
  }, [])

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

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newTheme = !prev
      document.documentElement.classList.toggle("dark", newTheme)
      return newTheme
    })
  }, [])

  const getCurrentBackground = () => {
    if (gameState === "menu") {
      return isDark
        ? "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
        : "bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100"
    }

    const level = levels[currentLevel - 1]
    if (!level) return "bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100"

    return isDark
      ? "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
      : `bg-gradient-to-br ${level.theme.background}`
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${getCurrentBackground()}`}>
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
          {gameState === "playing" && (
            <>
              <Card className="px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="text-sm font-medium">Level: {currentLevel}</div>
              </Card>
              <Card className="px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="text-sm font-medium">Bubbles: {bubblesRemaining}</div>
              </Card>
              {timeLeft !== null && (
                <Card className="px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                  <div className="text-sm font-medium">Time: {timeLeft}s</div>
                </Card>
              )}
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
        <p className="text-lg text-muted-foreground">Pop bubbles, level up, feel the vibes ✨</p>
      </div>

      {showLevelIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-center animate-bounce">
            <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Level {currentLevel}
            </div>
            <div className="text-2xl font-semibold mb-2">{levels[currentLevel - 1]?.name}</div>
            <div className="text-lg text-muted-foreground">{levels[currentLevel - 1]?.theme.name}</div>
            <div className="text-xl font-bold mt-4 animate-pulse">Let's Pop! 🎯</div>
          </Card>
        </div>
      )}

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

      {gameState === "menu" && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-center max-w-md">
            <div className="text-2xl font-bold mb-6">Choose Your Level</div>
            <div className="grid gap-3">
              {levels.map((level) => (
                <Button
                  key={level.number}
                  onClick={() => startLevel(level.number)}
                  className="w-full justify-between bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  disabled={level.number > currentLevel && currentLevel < levels.length}
                >
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span>
                      Level {level.number}: {level.name}
                    </span>
                  </div>
                  <div className="text-xs opacity-80">
                    {level.bubbleCount} bubbles
                    {level.timeLimit && ` • ${level.timeLimit}s`}
                  </div>
                </Button>
              ))}
            </div>
            {unlockedRewards.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-lg">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Unlocked Rewards
                </div>
                <div className="text-xs space-y-1">
                  {unlockedRewards.map((reward, index) => (
                    <div key={index} className="text-muted-foreground">
                      {reward}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {gameState === "levelComplete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-center">
            <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {completionMessage}
            </div>
            <div className="text-lg mb-6">
              Level {currentLevel} Complete!
              {levels[currentLevel - 1]?.unlocks && (
                <div className="text-sm text-muted-foreground mt-2">New rewards unlocked! 🎁</div>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setGameState("menu")} variant="outline">
                Level Select
              </Button>
              {currentLevel < levels.length && (
                <Button
                  onClick={() => startLevel(currentLevel + 1)}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  Next Level
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {gameState === "gameComplete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="p-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-center">
            <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              🏆 GAME COMPLETE! 🏆
            </div>
            <div className="text-xl mb-2">Bubble Master Achieved!</div>
            <div className="text-lg mb-6">
              Final Score: {score} | Best Streak: {bestStreak}
            </div>
            <Button
              onClick={resetGame}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Play Again
            </Button>
          </Card>
        </div>
      )}

      {/* Game Area */}
      {gameState === "playing" && (
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
                className={`w-full h-full rounded-full bg-gradient-to-br ${bubble.color} shadow-lg border-2 border-white/30 dark:border-white/10 relative overflow-hidden`}
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
      )}

      {/* Instructions */}
      <div className="text-center mt-6 px-4">
        <p className="text-sm text-muted-foreground">
          {gameState === "menu"
            ? "Select a level to start popping bubbles • Each level brings new challenges and rewards"
            : "Tap or click bubbles to pop them • Build streaks for bonus quotes • Complete levels to unlock rewards"}
        </p>
      </div>
    </div>
  )
}
