"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Flag, HelpCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthResponse, Challenge, Category } from "../types/type"

export default function MemeTagChallenge() {
    const router = useRouter()
    const [flag, setFlag] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isSolved, setIsSolved] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hintUnlocked, setHintUnlocked] = useState(false)
    const [userPoints, setUserPoints] = useState(0)
    const [questionData, setQuestionData] = useState<{
        title: string;
        description: string;
        category: string;
        difficulty: string;
        points: number;
        hint: string;
    } | null>(null)

    // Check status on mount
    useEffect(() => {
        async function checkStatus() {
            try {
                // Check auth
                const authResponse = await fetch('/api/auth/check', {
                    credentials: 'include'
                })
                const authData = await authResponse.json() as AuthResponse
                if (authData.authenticated) {
                    setUserPoints(authData.user.points)
                }

                // Check challenge status
                const response = await fetch('/api/questions', {
                    credentials: 'include'
                })
                const data = await response.json() as Category[];
                const memeCategory = data.find((cat: Category) =>
                    cat.challenges.some((c: Challenge) => c.id === 3)
                )
                if (memeCategory) {
                    const challenge = memeCategory.challenges.find((c: Challenge) => c.id === 3)
                    if (challenge) {
                        setQuestionData({
                            title: challenge.title,
                            description: challenge.description,
                            category: memeCategory.category,
                            difficulty: challenge.difficulty,
                            points: challenge.points,
                            hint: challenge.hint
                        })
                        setIsSolved(challenge.solved)
                        setHintUnlocked(challenge.hintUnlocked)
                    } else {
                        setError("Challenge not found")
                        setIsLoading(false)
                        return
                    }
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
        if (!questionData) return;
        const hintCost = Math.floor(questionData.points / 2);

        try {
            const response = await fetch('/api/questions/3/hint', {
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
            console.error('Failed to unlock hint:', error)
            setError('Failed to unlock hint')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess(false)

        try {
            const response = await fetch('/api/questions/3/submit', {
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
                setError(`LOL! You got ${data.points} points!`)
                setTimeout(() => {
                    router.refresh()
                    router.push('/dashboard')
                }, 2000)
            } else {
                setError("Nope, that's not the meme magic we're looking for!")
            }
        } catch (error) {
            console.error('Flag submission error:', error)
            setError('Error submitting flag. Try again, fam!')
        }
    }

    // Refresh points periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            const authResponse = await fetch('/api/auth/check', { credentials: 'include' })
            const authData = await authResponse.json()
            if (authData.authenticated) setUserPoints(authData.user.points)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-[#0F1117] text-white">
            {isLoading || !questionData ? (
                <div className="flex items-center justify-center min-h-screen">
                    Loading meme...
                </div>
            ) : (
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" className="text-[#00FF9D] hover:text-[#00FF9D]/80">
                                    <ArrowLeft className="h-5 w-5" />
                                    <span className="sr-only">Back to Dashboard</span>
                                </Link>
                                <h1 className="text-2xl font-bold">{questionData.title}</h1>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171B26] rounded-lg border border-gray-800">
                                <Trophy className="h-4 w-4 text-[#00FF9D]" />
                                <span className="font-medium text-[#00FF9D]">{userPoints} pts</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="bg-[#171B26] px-2 py-1 rounded">{questionData.category}</span>
                            <span className="bg-[#171B26] px-2 py-1 rounded">{questionData.difficulty}</span>
                            <span className="bg-[#171B26] px-2 py-1 rounded">{questionData.points} points</span>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
                                <h2 className="text-lg font-semibold mb-4">Challenge Description</h2>
                                <p className="text-gray-400 mb-4">
                                    Sometimes pictures speak louder than words… if you know where to look!
                                    Check out this meme and find the hidden flag. You might need more
                                    than your eyes to LOL your way to victory!
                                </p>
                                <Image
                                    src="/encoded_image.png"
                                    alt="meme with hidden flag"
                                    width={500}
                                    height={500}
                                    unoptimized
                                    className="object-contain rounded"
                                />

                            </div>

                            <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Hint</h2>
                                    {!hintUnlocked && (
                                        <span className="text-sm text-gray-400">
                                            Cost: {Math.floor(questionData.points / 2)} points
                                        </span>
                                    )}
                                </div>

                                {hintUnlocked ? (
                                    <p className="text-gray-400">
                                        {questionData.hint}
                                    </p>
                                ) : (
                                    <div className="text-center py-4">
                                        <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400 mb-4">
                                            Stuck? Unlock this hint for {Math.floor(questionData.points / 2)} points
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
                                    You&apos;ve memed your way to victory!
                                    <Link href="/dashboard" className="block mt-2 text-[#00FF9D] hover:underline">
                                        Back to dashboard
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Input
                                            type="text"
                                            placeholder="flag{...}"
                                            value={flag}
                                            onChange={(e) => setFlag(e.target.value)}
                                            className="bg-[#0F1117] border-gray-800 text-white placeholder:text-gray-500"
                                        />
                                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                                        {success && (
                                            <p className="text-[#00FF9D] text-sm mt-2">
                                                Epic win! Redirecting to dashboard...
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
            )}
        </div>
    )
}