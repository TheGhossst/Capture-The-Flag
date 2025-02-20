"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        })
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error('Failed to check authentication:', error)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    setIsAuthenticated(false)
    router.push('/')
  }

  return (
    <div className={`min-h-screen bg-black text-white ${inter.className}`}>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-right gap-2">
            <span className="text-emerald-400 font-mono">[CTF]</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/leaderboard" className="text-zinc-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
            {isAuthenticated ? (
              <Button 
                variant="ghost" 
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10" 
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-32 pb-16 min-h-screen flex flex-col items-center justify-center text-center">
        <div className="space-y-6 max-w-4xl">
          <span className="inline-block px-4 py-1 text-sm font-medium bg-emerald-400/10 text-emerald-400 rounded-full">
            Test Your Skills
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight">
            Master the Art of{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
              Cybersecurity
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
            Join our elite capture the flag competition. Solve complex challenges, exploit vulnerabilities, and compete
            against the best in the field.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
              {!isAuthenticated ? (<Link href="/login">Get Started</Link>) : (<Link href="/dashboard">Go to Dashboard</Link>) }
            </Button>
            <Button size="lg" variant="outline" className="border-zinc-800 hover:bg-zinc-800/50 text-white" asChild>
              <Link href="#">Learn More</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}