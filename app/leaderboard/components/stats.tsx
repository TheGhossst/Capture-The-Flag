"use client"

import { Trophy, Target, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface Stats {
  rank: number
  points: number
  totalParticipants: number
}

export function LeaderboardStats() {
  const [stats, setStats] = useState<Stats>({
    rank: 0,
    points: 0,
    totalParticipants: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.authenticated) {
          setStats({
            rank: data.user.rank,
            points: data.user.points,
            totalParticipants: data.totalParticipants
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#00FF85]/10 rounded-lg">
            <Trophy className="h-5 w-5 text-[#00FF85]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Your Rank</p>
            <p className="text-2xl font-bold">#{stats.rank}</p>
          </div>
        </div>
      </div>
      <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#00FF85]/10 rounded-lg">
            <Target className="h-5 w-5 text-[#00FF85]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Your Points</p>
            <p className="text-2xl font-bold">{stats.points.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#00FF85]/10 rounded-lg">
            <Users className="h-5 w-5 text-[#00FF85]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Total Participants</p>
            <p className="text-2xl font-bold">{stats.totalParticipants}</p>
          </div>
        </div>
      </div>
    </div>
  )
}