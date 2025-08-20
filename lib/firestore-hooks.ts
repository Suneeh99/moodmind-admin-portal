"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface User {
  id: string
  displayName: string
  email: string
  role: "user" | "consultant"
  verified: boolean
  createdAt: Timestamp
  cvUrl?: string
  linkedinUrl?: string
  active?: boolean
  rejected?: boolean
  rejectReason?: string
}

export interface DiaryEntry {
  id: string
  userId: string
  date: Timestamp
  createdAt: Timestamp
  sentimentAnalysis: {
    joy: number
    anger: number
    fear: number
  }
  dominantEmotion: string
  confidenceScore: number
}

export interface Chat {
  id: string
  consultantId: string
  participants: string[]
  createdAt: Timestamp
  lastMessage: string
  lastMessageTime: Timestamp
  lastSenderId: string
  lastMessageSeenBy: string[]
  consultantSeen: Timestamp
}

export interface EmergencyContact {
  id: string
  userId: string
  name: string
  phoneNumber: string
  relationship: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Task {
  id: string
  userId: string
  title: string
  date: Timestamp
  createdAt: Timestamp
  completedAt?: Timestamp
  status: "pending" | "completed" | "verified"
  timeHour: number
  timeMinute: number
  requiresVerification: boolean
  verificationPhotoUrl?: string
  pointsAwarded: number
}

export interface UserPoints {
  id: string
  userId: string
  userName: string
  photoUrl?: string
  totalPoints: number
  rank: number
  lastUpdated: Timestamp
}

export interface PointsTransaction {
  id: string
  userId: string
  taskId: string
  points: number
  type: "earned" | "adjusted"
  reason: string
  createdAt: Timestamp
}

export interface MotivationReel {
  id: string
  title: string
  author: string
  source: string
  videoUrl: string
  thumbnailUrl: string
  active: boolean
  createdAt: Timestamp
}

// Hook for fetching users with filters
export function useUsers(filters: {
  role?: "user" | "consultant"
  verified?: boolean
  searchTerm?: string
  pageSize?: number
}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        let q = query(collection(db, "users"), orderBy("createdAt", "desc"))

        if (filters.role) {
          q = query(q, where("role", "==", filters.role))
        }
        if (filters.verified !== undefined) {
          q = query(q, where("verified", "==", filters.verified))
        }
        if (filters.pageSize) {
          q = query(q, limit(filters.pageSize))
        }

        const snapshot = await getDocs(q)
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]

        // Client-side search filter
        let filteredUsers = usersData
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          filteredUsers = usersData.filter(
            (user) =>
              user.displayName?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower),
          )
        }

        setUsers(filteredUsers)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [filters.role, filters.verified, filters.searchTerm, filters.pageSize])

  return { users, loading, error, refetch: () => setLoading(true) }
}

// Hook for fetching diary entries with sentiment analysis
export function useDiaryInsights(dateRange?: { start: Date; end: Date }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true)
        let q = query(collection(db, "diary_entries"), orderBy("createdAt", "desc"), limit(100))

        if (dateRange) {
          q = query(
            q,
            where("createdAt", ">=", Timestamp.fromDate(dateRange.start)),
            where("createdAt", "<=", Timestamp.fromDate(dateRange.end)),
          )
        }

        const snapshot = await getDocs(q)
        const entriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          userId: doc.data().userId,
          date: doc.data().date,
          createdAt: doc.data().createdAt,
          sentimentAnalysis: doc.data().sentimentAnalysis,
          dominantEmotion: doc.data().dominantEmotion,
          confidenceScore: doc.data().confidenceScore,
        })) as DiaryEntry[]

        setEntries(entriesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch diary insights")
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [dateRange])

  return { entries, loading, error }
}

// Hook for fetching emergency contacts
export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, "emergency_contacts"), orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        const contactsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmergencyContact[]

        setContacts(contactsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch emergency contacts")
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  return { contacts, loading, error }
}

// Hook for fetching tasks
export function useTasks(timeWindow?: "24h" | "7d" | "30d") {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        let q = query(collection(db, "tasks"), orderBy("createdAt", "desc"))

        if (timeWindow) {
          const now = new Date()
          let startDate: Date
          switch (timeWindow) {
            case "24h":
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
              break
            case "7d":
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case "30d":
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              break
          }
          q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)))
        }

        const snapshot = await getDocs(q)
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[]

        setTasks(tasksData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tasks")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [timeWindow])

  return { tasks, loading, error }
}

// Hook for fetching points transactions
export function usePointsTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        let q = query(collection(db, "pointsTransactions"), orderBy("createdAt", "desc"))

        if (userId) {
          q = query(q, where("userId", "==", userId))
        }

        const snapshot = await getDocs(q)
        const transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PointsTransaction[]

        setTransactions(transactionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch points transactions")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [userId])

  return { transactions, loading, error }
}

// Hook for fetching user points
export function useUserPoints() {
  const [userPoints, setUserPoints] = useState<UserPoints[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, "userPoints"), orderBy("totalPoints", "desc"))
        const snapshot = await getDocs(q)
        const userPointsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserPoints[]

        setUserPoints(userPointsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user points")
      } finally {
        setLoading(false)
      }
    }

    fetchUserPoints()
  }, [])

  return { userPoints, loading, error }
}

// User management actions
export const userActions = {
  async approveConsultant(userId: string) {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, { verified: true })
  },

  async rejectConsultant(userId: string, reason?: string) {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      rejected: true,
      rejectReason: reason || "Application rejected",
      verified: false,
    })
  },

  async toggleUserActive(userId: string, active: boolean) {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, { active })
  },

  async deleteUser(userId: string) {
    const userRef = doc(db, "users", userId)
    await deleteDoc(userRef)
  },
}
