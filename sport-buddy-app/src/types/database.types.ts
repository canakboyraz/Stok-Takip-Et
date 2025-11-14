export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sports: {
        Row: {
          id: number
          name: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          icon?: string
          created_at?: string
        }
      }
      sport_sessions: {
        Row: {
          id: number
          creator_id: string
          sport_id: number
          title: string
          description: string | null
          location: string
          latitude: number
          longitude: number
          session_date: string
          max_participants: number
          skill_level: 'beginner' | 'intermediate' | 'advanced' | 'any'
          status: 'open' | 'full' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          creator_id: string
          sport_id: number
          title: string
          description?: string | null
          location: string
          latitude: number
          longitude: number
          session_date: string
          max_participants?: number
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'any'
          status?: 'open' | 'full' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          creator_id?: string
          sport_id?: number
          title?: string
          description?: string | null
          location?: string
          latitude?: number
          longitude?: number
          session_date?: string
          max_participants?: number
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'any'
          status?: 'open' | 'full' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      session_participants: {
        Row: {
          id: number
          session_id: number
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          session_id: number
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          session_id: number
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          session_id: number
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
