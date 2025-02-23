export interface AuthResponse {
    authenticated: boolean
    user: {
        id: number
        username: string
        points: number
    }
}
export interface Challenge {
    id: number
    title: string
    description: string
    difficulty: string
    points: number
    hint: string
    solved: boolean
    hintUnlocked: boolean
}

export interface Category {
    id: string
    category: string
    challenges: Challenge[]
}
