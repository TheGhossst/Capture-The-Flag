"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trophy, LogOut, Flag, Users, CheckCircle, Lock, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress, ProgressBar } from "./components/progress"

interface Challenge {
  id: number
  title: string
  description: string
  difficulty: string
  points: number
  hint: string
  link: string
  solved: boolean
}

interface Category {
  id: string
  category: string
  challenges: Challenge[]
}

interface UserStats {
  totalPoints: number
  solvedChallenges: number
  totalChallenges: number
  rank: number
  totalParticipants: number
}

export default function Dashboard() {
  const router = useRouter()
  const [openChallenge, setOpenChallenge] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userData, setUserData] = useState<{ id: number; username: string; points: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [challenges, setChallenges] = useState<Category[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    solvedChallenges: 0,
    totalChallenges: 0,
    rank: 0,
    totalParticipants: 0
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Check authentication and get user data
        const authResponse = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        const authData = await authResponse.json();

        if (!authData.authenticated) {
          router.push('/login');
          return;
        }

        setUserData(authData.user);

        // Fetch questions
        const questionsResponse = await fetch('/api/questions', {
          credentials: 'include'
        });
        const questionsData = await questionsResponse.json();
        setChallenges(questionsData);

        // Calculate stats
        const totalChallenges = questionsData.reduce(
          (total: number, category: Category) => total + category.challenges.length,
          0
        );
        
        const solvedChallenges = questionsData.reduce(
          (total: number, category: Category) =>
            total + category.challenges.filter(c => c.solved).length,
          0
        );

        // Calculate total points earned (from solved challenges)
        const earnedPoints = questionsData.reduce(
          (total: number, category: Category) =>
            total + category.challenges.reduce(
              (sum, challenge) => sum + (challenge.solved ? challenge.points : 0),
              0
            ),
          0
        );

        setStats({
          totalPoints: authData.user.points, // Use points from auth check
          solvedChallenges,
          totalChallenges,
          rank: authData.user.rank,
          totalParticipants: authData.totalParticipants
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChallengeClick = (challengeId: string, link: string) => {
    router.push(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#00FF9D]" />
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-400"
      case "medium":
        return "text-yellow-400"
      case "hard":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <Link href="/" className="text-[#00FF9D] text-xl font-medium">
          [CTF]
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Trophy className="h-5 w-5" />
            Leaderboard
          </Link>

          <Collapsible open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <CollapsibleTrigger>
              <div className="w-9 h-9 rounded-full bg-[#00FF9D] text-black font-medium flex items-center justify-center hover:bg-[#00FF9D]/90 transition-colors">
                {userData?.username.charAt(0).toUpperCase()}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute right-4 mt-2 w-56 bg-gray-900 rounded-lg border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-3 border-b border-gray-800">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="font-medium">{userData?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-3 text-left text-red-400 hover:bg-gray-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <Flag className="h-8 w-8 text-[#00FF9D]" />
              <div>
                <p className="text-gray-400">Total Points</p>
                <h3 className="text-2xl font-bold">{stats.totalPoints}</h3>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-[#00FF9D]" />
              <div>
                <p className="text-gray-400">Challenges Solved</p>
                <h3 className="text-2xl font-bold">
                  {stats.solvedChallenges}/{stats.totalChallenges}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-[#00FF9D]" />
              <div>
                <p className="text-gray-400">Current Rank</p>
                <h3 className="text-2xl font-bold">#{stats.rank}</h3>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-[#00FF9D]" />
              <div>
                <p className="text-gray-400">Total Participants</p>
                <h3 className="text-2xl font-bold">{stats.totalParticipants}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
          <ProgressBar
            value={(stats.solvedChallenges / stats.totalChallenges) * 100}
            className="bg-gray-800 h-2"
            indicatorClassName="bg-[#00FF9D]"
          />
          <p className="text-gray-400 mt-2 text-sm">
            {stats.solvedChallenges} out of {stats.totalChallenges} challenges completed
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Challenges</h2>

          {challenges.map((category) => (
            <Collapsible
              key={category.id}
              open={openChallenge === category.id}
              onOpenChange={() => setOpenChallenge(openChallenge === category.id ? null : category.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-[#00FF9D] transition-colors">
                <h3 className="text-lg font-semibold">{category.category}</h3>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${openChallenge === category.id ? "transform rotate-180" : ""
                    }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {category.challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center gap-4">
                      {challenge.solved ? (
                        <CheckCircle className="h-5 w-5 text-[#00FF9D]" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-600" />
                      )}
                      <div>
                        <h4 className="font-medium">{challenge.title}</h4>
                        <p className={`text-sm ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#00FF9D] font-medium">{challenge.points} pts</span>
                      <Button
                        variant="outline"
                        className="border-gray-800 hover:border-[#00FF9D] hover:text-[#00FF9D]"
                        onClick={() => handleChallengeClick(challenge.id.toString(), challenge.link)}
                      >
                        {challenge.solved ? "Challenge Solved" : "Solve Challenge"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}