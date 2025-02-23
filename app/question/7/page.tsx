"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Flag, HelpCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthResponse, Category } from "../types/type"
import bcrypt from 'bcryptjs'

interface QuestionData {
    title: string
    description: string
    category: string
    difficulty: string
    points: number
    hint: string
    solved: boolean
    hintUnlocked: boolean
}

export default function MultiStepChallenge() {
    const router = useRouter()
    const [flag, setFlag] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isSolved, setIsSolved] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hintUnlocked, setHintUnlocked] = useState(false)
    const [userPoints, setUserPoints] = useState(0)
    const [questionData, setQuestionData] = useState<QuestionData | null>(null)
    const [step3Input, setStep3Input] = useState("")
    const [step3Verified, setStep3Verified] = useState(false)

    useEffect(() => {
        async function checkStatus() {
            try {
                const authResponse = await fetch('/api/auth/check', { credentials: 'include' })
                const authData = await authResponse.json() as AuthResponse
                if (authData.authenticated) {
                    setUserPoints(authData.user.points)
                }

                const response = await fetch('/api/questions', { credentials: 'include' })
                const data = await response.json() as Category[]

                const multiStepCategory = data.find(cat =>
                    cat.challenges.some(c => c.id === 7)
                )

                if (multiStepCategory) {
                    const challenge = multiStepCategory.challenges.find(c => c.id === 7)
                    if (challenge) {
                        setQuestionData({
                            title: challenge.title,
                            description: challenge.description,
                            category: multiStepCategory.category,
                            difficulty: challenge.difficulty,
                            points: challenge.points,
                            hint: challenge.hint,
                            solved: challenge.solved,
                            hintUnlocked: challenge.hintUnlocked
                        })
                        setIsSolved(challenge.solved)
                        setHintUnlocked(challenge.hintUnlocked)
                    } else {
                        setError("Challenge not found")
                    }
                }
                setIsLoading(false)
            } catch (error) {
                console.error('Failed to check status:', error)
                setError("Failed to load challenge")
                setIsLoading(false)
            }
        }
        checkStatus()
    }, [])

    const unlockHint = async () => {
        if (!questionData) return
        const hintCost = Math.floor(questionData.points / 2)

        try {
            const response = await fetch('/api/questions/7/hint', {
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
            const response = await fetch('/api/questions/7/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ flag })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
                setIsSolved(true)
                setUserPoints(prev => prev + data.points)
                setError(`You've solved the multi-step challenge!`)
                setTimeout(() => {
                    router.refresh()
                    router.push('/dashboard')
                }, 2000)
            } else {
                setError('Incorrect flag. Please try again.')
            }
        } catch (error) {
            console.error('Error submitting flag:', error)
            setError('Error submitting flag. Please try again later.')
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

    const hashAndVerify = async (input: string) => {
        try {
            const hashedInput = await bcrypt.hash(input, 12)
            console.log(hashedInput)
            const isMatch = await bcrypt.compare(input, "$2b$12$Fmmw9hreZe0aT/iW6fLXRuR4q/sBGIkMOt/oyWA.H5TfH1ZmmpNh.")
            return isMatch
        } catch (error) {
            console.error('Hashing error:', error)
            return false
        }
    }

    if (isLoading || !questionData) {
        return <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center">
            Loading challenge...
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
                            <div className="space-y-6">
                                <div>
                                    <p className="text-gray-400">
                                        Welcome to the multi-step challenge! This challenge consists of several steps that you need to solve in sequence to find the flag. Let&apos;s start with a riddle.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold mb-2">Step 1: The Riddle of Beginnings</h3>
                                    <p className="text-gray-400">
                                        Riddle:<b> &quot;I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?&quot;</b>
                                        <br />
                                        Solve this riddle to get the first key.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold mb-2">Step 2: Ciphered Secrets</h3>
                                    <p className="text-gray-400">
                                        Using the key from Step 1, decrypt the following Vigenère cipher:
                                        <br />
                                        <code className="block bg-[#0F1117] p-2 rounded mt-2 font-mono">
                                            srlbxjlxet
                                        </code>
                                        <span className="block mt-2">
                                            The decrypted message will give you the next clue.
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold mb-2">Step 3: Jar of Secrets</h3>
                                    <p className="text-gray-400 mb-4">
                                        Enter the answer from Step 2 to reveal the image.
                                    </p>

                                    {!step3Verified ? (
                                        <div className="space-y-4">
                                            <Input
                                                type="text"
                                                placeholder="Enter your answer..."
                                                value={step3Input}
                                                onChange={(e) => setStep3Input(e.target.value)}
                                                className="bg-[#0F1117] border-gray-800 text-white placeholder:text-gray-500 font-mono text-sm"
                                            />
                                            <Button
                                                onClick={async () => {
                                                    const isValid = await hashAndVerify(step3Input)
                                                    setStep3Verified(isValid)
                                                    if (!isValid && step3Input) {
                                                        setError("Incorrect answer. Try again.")
                                                    }
                                                }}
                                                className="w-full bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90"
                                            >
                                                Check Answer
                                            </Button>
                                            {error && step3Input && (
                                                <p className="text-red-400 text-sm">
                                                    {error}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative w-full h-64 my-4">
                                                <Image
                                                    src="/jar.jpg"
                                                    alt="Jar with hidden message"
                                                    fill
                                                    unoptimized
                                                    className="object-contain rounded"
                                                />
                                            </div>
                                            <p className="text-gray-500 text-sm">
                                                Inspect the image to find a hidden message using steganography tools.
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold mb-2">Step 4: Binary Wonderland</h3>
                                    <p className="text-gray-400">
                                        The hidden message from Step 3 will lead you to a binary string. Convert it to text to get the final key.
                                        <br />
                                        The binary string is:
                                        <pre className="bg-[#0F1117] p-2 rounded my-2 font-mono overflow-x-auto">
                                            01100110 01101001 01101110 01100001 01101100 01101011 01100101 01111001
                                        </pre>
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold mb-2">Step 5: The Final Door</h3>
                                    <p className="text-gray-400">
                                        Use the final key to reveal the flag. Submit the flag through the form below.
                                    </p>
                                </div>
                            </div>
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
                                <p className="text-gray-400">{questionData.hint}</p>
                            ) : (
                                <div className="text-center py-4">
                                    <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 mb-4">
                                        Need a hint? Unlock this hint for {Math.floor(questionData.points / 2)} points
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
                                You&apos;ve solved this challenge!
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
                                            Flag accepted! Redirecting to dashboard...
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