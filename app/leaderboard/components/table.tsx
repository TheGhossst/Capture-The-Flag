"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Trophy } from "lucide-react"
import Link from "next/link"
import React from "react"

interface Participant {
  id: number
  rank: number
  username: string
  points: number
  solved: number
  lastActive: string
  isCurrentUser: boolean
}

interface PaginationData {
  total: number
  pages: number
  currentPage: number
}

export function LeaderboardTable() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    currentPage: 1
  })
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<string>("rank")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const fetchLeaderboard = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/leaderboard?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.users) {
        setParticipants(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.currentPage])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.pages) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))
    }
  }

  const handlePrevPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (field !== sortField) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-[#171B26] rounded-lg border border-gray-800">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-gray-800">
            <TableHead className="w-[100px]">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium text-gray-400 hover:text-white -ml-4"
                onClick={() => handleSort("rank")}
              >
                Rank
                <SortIcon field="rank" />
              </Button>
            </TableHead>
            <TableHead>Username</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="font-medium text-gray-400 hover:text-white -ml-4"
                onClick={() => handleSort("points")}
              >
                Points
                <SortIcon field="points" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="font-medium text-gray-400 hover:text-white -ml-4"
                onClick={() => handleSort("solved")}
              >
                Challenges Solved
                <SortIcon field="solved" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium text-gray-400 hover:text-white -ml-4"
                onClick={() => handleSort("lastActive")}
              >
                Last Active
                <SortIcon field="lastActive" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow
              key={participant.id}
              className={`
                hover:bg-[#00FF85]/5 border-gray-800
                ${participant.isCurrentUser ? "bg-[#00FF85]/10" : ""}
              `}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {participant.rank <= 3 && (
                    <Trophy
                      className={`h-4 w-4 ${
                        participant.rank === 1
                          ? "text-yellow-500"
                          : participant.rank === 2
                          ? "text-gray-400"
                          : "text-orange-600"
                      }`}
                    />
                  )}
                  #{participant.rank}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/profile/${participant.username}`} className="hover:text-[#00FF85] transition-colors">
                  {participant.username}
                </Link>
              </TableCell>
              <TableCell>{participant.points.toLocaleString()}</TableCell>
              <TableCell>{participant.solved}</TableCell>
              <TableCell className="text-right text-gray-400">
                {new Date(participant.lastActive).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-4 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          Showing <span className="font-medium text-white">{(pagination.currentPage - 1) * 10 + 1}</span> to{" "}
          <span className="font-medium text-white">
            {Math.min(pagination.currentPage * 10, pagination.total)}
          </span> of <span className="font-medium text-white">{pagination.total}</span> participants
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.currentPage === 1}
            onClick={handlePrevPage}
            className="border-gray-800 hover:bg-[#00FF85]/10 hover:text-[#00FF85]"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.currentPage === pagination.pages}
            onClick={handleNextPage}
            className="border-gray-800 hover:bg-[#00FF85]/10 hover:text-[#00FF85]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}