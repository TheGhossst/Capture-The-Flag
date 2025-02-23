"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Flag, HelpCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthResponse, Category, Challenge } from "../types/type"

export default function SteganographyChallenge() {
  const router = useRouter()
  const [flag, setFlag] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hintUnlocked, setHintUnlocked] = useState(false)
  const [hintCost] = useState(50)
  const [userPoints, setUserPoints] = useState(0)

  // Check if question is already solved and hint status
  useEffect(() => {
    async function checkStatus() {
      try {
        // Get user data first
        const authResponse = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        const authData = await authResponse.json() as AuthResponse;
        if (authData.authenticated) {
          setUserPoints(authData.user.points);
        }

        const response = await fetch('/api/questions', {
          credentials: 'include'
        })
        const data = await response.json() as Category[];

        const stegCategory = data.find((cat: Category) =>
          cat.challenges.some((c: Challenge) => c.id === 1)
        )
        if (stegCategory) {
          const challenge = stegCategory.challenges.find((c: Challenge) => c.id === 1)
          setIsSolved(challenge?.solved || false)
          setHintUnlocked(challenge?.hintUnlocked || false)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to check status:', error)
        setIsLoading(false)
      }
    }
    checkStatus()
  }, [])

  const unlockHint = async () => {
    try {
      const response = await fetch('/api/questions/1/hint', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setHintUnlocked(true)
        setUserPoints(prev => prev - hintCost)
      } else {
        setError(data.error || 'Failed to unlock hint')
      }
    } catch (error) {
      console.error('Hint unlock error:', error)
      setError('Failed to unlock hint')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    try {
      const response = await fetch('/api/questions/1/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ flag })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setIsSolved(true)
        setUserPoints(prev => prev + data.points)
        setError(`Congratulations! You earned ${data.points} points!`)
        setTimeout(() => {
          router.refresh()
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Incorrect flag')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('Failed to submit flag')
    }
  }

  // Add function to refresh points
  const refreshPoints = async () => {
    try {
      const authResponse = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      const authData = await authResponse.json();
      if (authData.authenticated) {
        setUserPoints(authData.user.points);
      }
    } catch (error) {
      console.error('Failed to refresh points:', error);
    }
  };

  // Add interval to refresh points periodically
  useEffect(() => {
    const interval = setInterval(refreshPoints, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center">
      Loading...
    </div>
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-[#00FF9D] hover:text-[#00FF9D]/80">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Hidden in Plain Sight</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171B26] rounded-lg border border-gray-800">
              <Trophy className="h-4 w-4 text-[#00FF9D]" />
              <span className="font-medium text-[#00FF9D]">{userPoints} pts</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="bg-[#171B26] px-2 py-1 rounded">Steganography</span>
            <span className="bg-[#171B26] px-2 py-1 rounded">Easy</span>
            <span className="bg-[#171B26] px-2 py-1 rounded">100 points</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Challenge Description</h2>
              <p className="text-gray-400">
                Sometimes the most obvious places are the best hiding spots.
                The flag is hidden somewhere on this page, but it might not be
                where you expect it. Remember, in web development, elements can
                have many properties...
              </p>
            </div>

            <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Hint</h2>
                {!hintUnlocked && (
                  <span className="text-sm text-gray-400">
                    Cost: {hintCost} points
                  </span>
                )}
              </div>

              {hintUnlocked ? (
                <p className="text-gray-400">
                  HTML elements can have various attributes. Some might be more
                  helpful than others when you&apos;re looking for something...
                </p>
              ) : (
                <div className="text-center py-4">
                  <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Need help? Unlock this hint for {hintCost} points
                  </p>
                  <Button
                    onClick={unlockHint}
                    variant="outline"
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    Unlock Hint
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Submit Flag</h2>
            {isSolved ? (
              <div className="text-[#00FF9D] text-sm">
                You&apos;ve already solved this challenge!
                <Link href="/dashboard" className="block mt-2 text-[#00FF9D] hover:underline">
                  Return to dashboard
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="eg: flag{steg0_b3ginner}"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    className="bg-[#0F1117] border-gray-800 text-white placeholder:text-gray-500"
                    title="Sometimes the obvious place is the right place"
                  />
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                  {success && (
                    <p className="text-[#00FF9D] text-sm mt-2">
                      Congratulations! You found the flag! Redirecting to dashboard...
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Submit Flag
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 