import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function LeaderboardSkeleton() {
  return (
    <div className="bg-[#171B26] rounded-lg border border-gray-800">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-gray-800">
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Challenges Solved</TableHead>
            <TableHead className="text-right">Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i} className="border-gray-800">
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}