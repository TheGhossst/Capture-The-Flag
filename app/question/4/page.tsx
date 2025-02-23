"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GRID_SIZE = 23;
const MINE_COUNT = 80;
const TOTAL_POINTS = 100;
const HINT_COST = Math.floor(TOTAL_POINTS / 3);

interface Challenge {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    points: number;
    hint: string;
    solved: boolean;
    hintUnlocked: boolean;
}

interface Category {
    id: string;
    category: string;
    challenges: Challenge[];
}

interface AuthResponse {
    authenticated: boolean;
    user: {
        id: number;
        username: string;
        points: number;
    };
}

export default function MinesweeperChallenge() {
    const router = useRouter();
    const [grid, setGrid] = useState<(number | 'M')[][]>([]);
    const [revealed, setRevealed] = useState<boolean[][]>([]);
    const [flagged, setFlagged] = useState<boolean[][]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [won, setWon] = useState<boolean>(false);
    const [hintUnlocked, setHintUnlocked] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSolved, setIsSolved] = useState<boolean>(false);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const [questionData, setQuestionData] = useState<{
        title: string;
        description: string;
        category: string;
        difficulty: string;
        points: number;
        hint: string;
    } | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [flagInput, setFlagInput] = useState<string>("");

    useEffect(() => {
        async function checkStatus() {
            try {
                const authResponse = await fetch('/api/auth/check', { credentials: 'include' });
                const authData = await authResponse.json() as AuthResponse;
                if (authData.authenticated) {
                    setUserPoints(authData.user.points);
                }

                const response = await fetch('/api/questions', { credentials: 'include' });
                const data = await response.json() as Category[];
                const minesweeperChallenge = data.find(cat =>
                    cat.challenges.some(c => c.id === 4)
                );

                if (minesweeperChallenge) {
                    const challenge = minesweeperChallenge.challenges.find(c => c.id === 4);
                    if (challenge) {
                        setQuestionData({
                            title: challenge.title,
                            description: challenge.description,
                            category: minesweeperChallenge.category,
                            difficulty: challenge.difficulty,
                            points: challenge.points,
                            hint: challenge.hint
                        });
                        setIsSolved(challenge.solved);
                        setHintUnlocked(challenge.hintUnlocked);
                    } else {
                        setError("Challenge not found");
                        setIsLoading(false);
                        return;
                    }
                }

                initializeGame();
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to check status:', error);
                setError("Failed to load challenge");
                setIsLoading(false);
            }
        }
        checkStatus();
    }, []);

    useEffect(() => {
        interface AdminResponse {
            authenticated: boolean;
            user: {
                username: string;
            };
        }

        const revealMinesForAdmin = async (secretKey: string) => {
            try {
                const response = await fetch('/api/auth/check', {
                    credentials: 'include'
                });
                const data = await response.json() as AdminResponse;
                
                if (data.authenticated && data.user.username === 'admin' && secretKey === 'hashctf2024') {
                    setIsAdmin(true);
                    console.log(isAdmin);
                    const newRevealed = revealed.map((row, i) => 
                        row.map((cell, j) => grid[i][j] === 'M' ? true : cell)
                    );
                    setRevealed(newRevealed);
                    console.log('🎮 Admin cheat activated: All mines revealed!');
                } else {
                    console.log('🚫 Nice try! But this is for admins only.');
                }
            } catch (error) {
                console.error('Failed to verify admin status:', error);
            }
        };

        (window as Window & { revealMinesForAdmin?: typeof revealMinesForAdmin }).revealMinesForAdmin = revealMinesForAdmin;

        return () => {
            delete (window as Window & { revealMinesForAdmin?: typeof revealMinesForAdmin }).revealMinesForAdmin;
        };
    }, [grid, revealed, isAdmin]);

    const initializeGame = (): void => {
        const newGrid: (number | 'M')[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        const newRevealed: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
        const newFlagged: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

        let minesPlaced = 0;
        while (minesPlaced < MINE_COUNT) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            if (newGrid[x][y] !== 'M') {
                newGrid[x][y] = 'M';
                minesPlaced++;
            }
        }

        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (newGrid[i][j] !== 'M') {
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE && newGrid[ni][nj] === 'M') {
                                count++;
                            }
                        }
                    }
                    newGrid[i][j] = count;
                }
            }
        }

        setGrid(newGrid);
        setRevealed(newRevealed);
        setFlagged(newFlagged);
    };

    const revealCell = (x: number, y: number): void => {
        if (gameOver || revealed[x][y] || flagged[x][y]) return;

        const newRevealed = revealed.map(row => [...row]);
        newRevealed[x][y] = true;

        if (grid[x][y] === 'M') {
            setGameOver(true);
            revealAllMines();
            setError("Boom! You hit a mine. Game over!");
            return;
        }

        if (grid[x][y] === 0) {
            floodFill(x, y, newRevealed);
        }

        setRevealed(newRevealed);
        checkWin(newRevealed, flagged);
    };

    const floodFill = (x: number, y: number, newRevealed: boolean[][]): void => {
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const ni = x + di;
                const nj = y + dj;
                if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE && !newRevealed[ni][nj]) {
                    newRevealed[ni][nj] = true;
                    if (grid[ni][nj] === 0) {
                        floodFill(ni, nj, newRevealed);
                    }
                }
            }
        }
    };

    const revealAllMines = (): void => {
        const newRevealed = revealed.map((row, i) =>
            row.map((cell, j) => cell || grid[i][j] === 'M')
        );
        setRevealed(newRevealed);
    };

    const toggleFlag = (x: number, y: number, e: React.MouseEvent): void => {
        e.preventDefault(); // Prevent context menu
        if (gameOver || revealed[x][y]) return;
        const newFlagged = flagged.map(row => [...row]);
        newFlagged[x][y] = !newFlagged[x][y];
        setFlagged(newFlagged);
        checkWin(revealed, newFlagged);
    };

    const handleFlagSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/questions/4/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ flag: flagInput })
            });

            const data = await response.json();

            if (data.success) {
                setIsSolved(true);
                const earnedPoints = hintUnlocked
                    ? Math.floor(questionData!.points / 2)
                    : questionData!.points;

                setUserPoints(prev => prev + earnedPoints);
                setError(`Congratulations! You earned ${earnedPoints} points!`);

                setTimeout(() => {
                    router.refresh();
                    router.push('/dashboard');
                }, 3000);
            } else {
                setError(data.error || 'Incorrect flag. Try again!');
            }
        } catch (error) {
            console.error('Submit error:', error);
            setError('Failed to submit flag');
        }
    };

    const checkWin = async (currentRevealed: boolean[][], currentFlagged: boolean[][]): Promise<void> => {
        const allSafeRevealed = grid.every((row, i) =>
            row.every((cell, j) =>
                cell === 'M' || currentRevealed[i][j]
            )
        );

        const allMinesFlagged = grid.every((row, i) =>
            row.every((cell, j) =>
                cell !== 'M' || currentFlagged[i][j]
            )
        );

        if (allSafeRevealed || allMinesFlagged) {
            setWon(true);
            setGameOver(true);
            revealAllMines();
        }
    };

    const unlockHint = async (): Promise<void> => {
        try {
            const response = await fetch('/api/questions/4/hint', {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json() as { success: boolean; error?: string };
            if (data.success) {
                setHintUnlocked(true);
                setUserPoints(prev => prev - HINT_COST);
                const newRevealed = revealed.map(row => [...row]);
                const safeCells: [number, number][] = [];
                for (let i = 0; i < GRID_SIZE; i++) {
                    for (let j = 0; j < GRID_SIZE; j++) {
                        if (grid[i][j] !== 'M' && !newRevealed[i][j]) {
                            safeCells.push([i, j]);
                        }
                    }
                }
                const revealCount = Math.floor(safeCells.length * 0.25);
                for (let i = 0; i < revealCount; i++) {
                    const index = Math.floor(Math.random() * safeCells.length);
                    const [x, y] = safeCells[index];
                    newRevealed[x][y] = true;
                    safeCells.splice(index, 1);
                }
                setRevealed(newRevealed);
            }
        } catch (error) {
            console.error('Hint unlock error:', error);
            setError('Failed to unlock hint');
        }
    };

    const resetGame = (): void => {
        setGameOver(false);
        setWon(false);
        setError("");
        initializeGame();
    };

    if (isLoading || !questionData) {
        return <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center">Loading...</div>;
    }

    const minesLeft = MINE_COUNT - flagged.flat().filter(Boolean).length;

    const numberColors: Record<number, string> = {
        1: 'text-blue-500',
        2: 'text-green-500',
        3: 'text-red-500',
        4: 'text-purple-500',
        5: 'text-maroon',
        6: 'text-turquoise',
        7: 'text-black',
        8: 'text-gray-600',
    };

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
                            <p className="text-gray-400">{questionData.description}</p>
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
                                        Need help? Unlock this hint for {Math.floor(questionData.points / 2)} points
                                    </p>
                                    <Button
                                        onClick={unlockHint}
                                        variant="outline"
                                        className="border-gray-800 hover:bg-gray-800/50"
                                        disabled={isSolved}
                                    >
                                        Unlock Hint
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#171B26] p-6 rounded-lg border border-gray-800">
                        <h2 className="text-lg font-semibold mb-4">Minesweeper Challenge</h2>
                        {isSolved ? (
                            <div className="text-[#00FF9D] text-sm">
                                You&apos;ve already solved this challenge!
                                <Link href="/dashboard" className="block mt-2 text-[#00FF9D] hover:underline">
                                    Return to dashboard
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="mb-2 text-sm">
                                    Mines left: {minesLeft}
                                </div>
                                <div className="overflow-auto max-h-[600px] max-w-full">
                                    <div className="inline-block border border-gray-600">
                                        {grid.map((row, i) => (
                                            <div key={i} className="flex">
                                                {row.map((cell, j) => (
                                                    <div
                                                        key={j}
                                                        className={`w-6 h-6 border border-gray-500 cursor-pointer flex items-center justify-center text-xs ${revealed[i][j]
                                                            ? grid[i][j] === 'M'
                                                                ? 'bg-red-500'
                                                                : 'bg-white'
                                                            : flagged[i][j]
                                                                ? 'bg-yellow-200'
                                                                : 'bg-gray-300'
                                                            }`}
                                                        onClick={() => !flagged[i][j] && revealCell(i, j)}
                                                        onContextMenu={(e) => toggleFlag(i, j, e)}
                                                    >
                                                        {revealed[i][j] ? (
                                                            grid[i][j] === 'M' ? (
                                                                '💣'
                                                            ) : (
                                                                <span className={numberColors[grid[i][j] as number]}>
                                                                    {grid[i][j] || ''}
                                                                </span>
                                                            )
                                                        ) : flagged[i][j] ? (
                                                            '🚩'
                                                        ) : (
                                                            ''
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {gameOver && (
                                        <div className="text-center">
                                            {won ? (
                                                <div className="space-y-4">
                                                    <p className="text-[#00FF9D] text-sm">
                                                        Congratulations! You cleared the minefield! {"flag{minesweeper_master}"}
                                                    </p>
                                                    <form onSubmit={handleFlagSubmit} className="space-y-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Enter the flag (e.g., CTF{flag_here})"
                                                            value={flagInput}
                                                            onChange={(e) => setFlagInput(e.target.value)}
                                                            className="bg-[#0F1117] border-gray-800 text-white placeholder:text-gray-500"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            className="w-full bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90"
                                                            disabled={isSolved}
                                                        >
                                                            Submit Flag
                                                        </Button>
                                                    </form>
                                                    {error && <p className="text-red-400 text-sm">{error}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-red-400 text-sm">
                                                    {error}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <Button
                                        onClick={resetGame}
                                        variant="outline"
                                        className="w-full border-gray-800 hover:bg-gray-800/50"
                                        disabled={won}
                                    >
                                        Reset Game
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}