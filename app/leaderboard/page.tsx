import { Suspense } from "react"
import { LeaderboardHeader } from "./components/header"
import { LeaderboardSkeleton } from "./components/skeleton"
import { LeaderboardStats } from "./components/stats"
import { LeaderboardTable } from "./components/table"
export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      <div className="container mx-auto px-4 py-8">
        <LeaderboardHeader />
        <LeaderboardStats />
        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardTable />
        </Suspense>
      </div>
    </div>
  )
}