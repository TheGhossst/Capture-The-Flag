"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { Trophy, Flag, Users, CheckCircle } from "lucide-react"

import { cn } from "@/lib/utils"

// Rename the base Progress component to ProgressBar
const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string
  }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
ProgressBar.displayName = ProgressPrimitive.Root.displayName

// Stats Progress component
interface StatsProgressProps {
  totalPoints: number
  solvedChallenges: number
  totalChallenges: number
  rank: number
  totalParticipants: number
}

function StatsProgress({
  totalPoints,
  solvedChallenges,
  totalChallenges,
  rank,
  totalParticipants
}: StatsProgressProps) {
  const progressPercentage = (solvedChallenges / totalChallenges) * 100

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-[#171B26] p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#00FF9D]" />
          <h3 className="text-sm font-medium">Total Points</h3>
        </div>
        <p className="text-2xl font-bold text-[#00FF9D]">{totalPoints}</p>
      </div>

      <div className="bg-[#171B26] p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-[#00FF9D]" />
          <h3 className="text-sm font-medium">Challenges Solved</h3>
        </div>
        <p className="text-2xl font-bold">
          {solvedChallenges}/{totalChallenges}
        </p>
        <div className="mt-2">
          <div className="bg-gray-800 h-2 rounded-full">
            <div
              className="bg-[#00FF9D] h-2 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#171B26] p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#00FF9D]" />
          <h3 className="text-sm font-medium">Your Rank</h3>
        </div>
        <p className="text-2xl font-bold">
          {rank}/{totalParticipants}
        </p>
      </div>

      <div className="bg-[#171B26] p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-[#00FF9D]" />
          <h3 className="text-sm font-medium">Completion</h3>
        </div>
        <p className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</p>
      </div>
    </div>
  )
}

export { ProgressBar, StatsProgress as Progress }

