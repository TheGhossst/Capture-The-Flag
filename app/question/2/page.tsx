"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Flag, HelpCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthResponse, Category, Challenge } from "../types/type"



export default function CookieMonsterChallenge() {
    const router = useRouter()
    const [flag, setFlag] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isSolved, setIsSolved] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hintUnlocked, setHintUnlocked] = useState(false)
    const [hintCost] = useState(50)
    const [userPoints, setUserPoints] = useState(0)

    useEffect(() => {
        async function initializeChallenge() {
            try {
                document.cookie = "cookie_monster_part1=flag{; path=/; SameSite=Lax"
                document.cookie = "cookie_monster_part2=cookie_; path=/; SameSite=Lax"
                document.cookie = "cookie_monster_part3=crumble_; path=/; SameSite=Lax"
                document.cookie = "cookie_monster_part4=complete}; path=/; SameSite=Lax"
                document.cookie = "nom_nom_nom=Me love cookies!; path=/; SameSite=Lax" // Decoy cookie

                const authResponse = await fetch('/api/auth/check', {
                    credentials: 'include'
                })
                const authData = await authResponse.json() as AuthResponse
                if (authData.authenticated) {
                    setUserPoints(authData.user.points)
                }

                const response = await fetch('/api/questions', {
                    credentials: 'include'
                })
                const data = await response.json() as Category[];
                const cookieChallenge = data.find((cat: Category) =>
                    cat.challenges.some((c: Challenge) => c.id === 2)
                )
                if (cookieChallenge) {
                    const challenge = cookieChallenge.challenges.find((c: Challenge) => c.id === 2)
                    setIsSolved(challenge?.solved || false)
                    setHintUnlocked(challenge?.hintUnlocked || false)
                }
                setIsLoading(false)
            } catch (error) {
                console.error('Failed to initialize:', error)
                setIsLoading(false)
            }
        }
        initializeChallenge()
    }, [])

    const unlockHint = async () => {
        try {
            const response = await fetch('/api/questions/2/hint', {
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
            const response = await fetch('/api/questions/2/submit', {
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
                setError(`Om nom nom! You earned ${data.points} points!`)
                setTimeout(() => {
                    router.refresh()
                    router.push('/dashboard')
                }, 2000)
            } else {
                setError('Wrong flag! Me still hungry for right answer!')
            }
        } catch (error) {
            console.error('Submit error:', error)
            setError('Error submitting flag. Me sad.')
        }
    }

    useEffect(() => {
        const interval = setInterval(async () => {
            const authResponse = await fetch('/api/auth/check', { credentials: 'include' })
            const authData = await authResponse.json()
            if (authData.authenticated) setUserPoints(authData.user.points)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    if (isLoading) {
        return <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center">
            Loading cookies...
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
                            <h1 className="text-2xl font-bold">Cookie Monster</h1>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171B26] rounded-lg border border-gray-800">
                            <Trophy className="h-4 w-4 text-[#00FF9D]" />
                            <span className="font-medium text-[#00FF9D]">{userPoints} pts</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="bg-[#171B26] px-2 py-1 rounded">Web</span>
                        <span className="bg-[#171B26] px-2 py-1 rounded">Medium</span>
                        <span className="bg-[#171B26] px-2 py-1 rounded">150 points</span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
                            <h2 className="text-lg font-semibold mb-4">Challenge Description</h2>
                            <p className="text-gray-400">
                                Me want cookie—and flag! Me hide pieces of flag in yummy HTTP cookies.
                                Use browser developer tools to find cookie crumbs and put them together.
                                Om nom nom nom!
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
                                    Me split flag into four cookie pieces. Look for cookies starting with
                                    &quot;cookie_monster_part&quot; in developer tools. Ignore me nom nom noise!
                                </p>
                            ) : (
                                <div className="text-center py-4">
                                    <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 mb-4">
                                        Me hide flag good! Need hint? Cost {hintCost} points
                                    </p>
                                    <Button
                                        onClick={unlockHint}
                                        variant="outline"
                                        className="border-gray-800 hover:bg-gray-800/50"
                                    >
                                        Unlock Cookie Hint
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
                        <h2 className="text-lg font-semibold mb-4">Submit Flag</h2>
                        {isSolved ? (
                            <div className="text-[#00FF9D] text-sm">
                                Me happy! You solved cookie challenge!
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
                                            Me love you! Flag correct! Heading to dashboard...
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90"
                                >
                                    <Flag className="h-4 w-4 mr-2" />
                                    Submit Cookie Flag
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}