import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, Search } from "lucide-react"
import Link from "next/link"

export function LeaderboardHeader() {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#00FF85] hover:text-[#00FF85]/80">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-sm text-gray-400">See how you stack up against other participants!</p>
        </div>
        <Button variant="outline" size="icon" className="border-[#00FF85] text-[#00FF85] hover:bg-[#00FF85]/10">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh Leaderboard</span>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search participants..."
            className="pl-8 bg-[#171B26] border-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-[#00FF85]"
          />
        </div>
        <select className="bg-[#171B26] border border-gray-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00FF85]">
          <option value="all">All Participants</option>
          <option value="top10">Top 10</option>
          <option value="top50">Top 50</option>
          <option value="top100">Top 100</option>
        </select>
      </div>
    </div>
  )
}