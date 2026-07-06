export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          board_id: string
          body: string | null
          created_at: string
          id: string
          is_pinned: boolean
          pinned_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          board_id: string
          body?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          board_id?: string
          body?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      arcs: {
        Row: {
          board_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          sprint_length_days: number
          start_date: string | null
        }
        Insert: {
          board_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          sprint_length_days: number
          start_date?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          sprint_length_days?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arcs_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          board_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["board_role"]
          team_id: string | null
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["board_role"]
          team_id?: string | null
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["board_role"]
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_members_team_id_board_id_fkey"
            columns: ["team_id", "board_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id", "board_id"]
          },
          {
            foreignKeyName: "board_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_statuses: {
        Row: {
          board_id: string
          category: Database["public"]["Enums"]["status_category"]
          color: string | null
          id: string
          name: string
          position: number
        }
        Insert: {
          board_id: string
          category: Database["public"]["Enums"]["status_category"]
          color?: string | null
          id?: string
          name: string
          position?: number
        }
        Update: {
          board_id?: string
          category?: Database["public"]["Enums"]["status_category"]
          color?: string | null
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_statuses_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          arc_size: number
          created_at: string
          id: string
          max_members: number | null
          max_teams: number | null
          name: string
          owner_id: string
          plan: string
          settings: Json
          sprint_length_days: number
          updated_at: string
        }
        Insert: {
          arc_size?: number
          created_at?: string
          id?: string
          max_members?: number | null
          max_teams?: number | null
          name: string
          owner_id: string
          plan?: string
          settings?: Json
          sprint_length_days?: number
          updated_at?: string
        }
        Update: {
          arc_size?: number
          created_at?: string
          id?: string
          max_members?: number | null
          max_teams?: number | null
          name?: string
          owner_id?: string
          plan?: string
          settings?: Json
          sprint_length_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          board_id: string
          body: string
          created_at: string
          epic_id: string | null
          id: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          board_id: string
          body: string
          created_at?: string
          epic_id?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          board_id?: string
          body?: string
          created_at?: string
          epic_id?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_items: {
        Row: {
          assignee_id: string | null
          board_id: string
          created_at: string
          for_date: string
          id: string
          is_done: boolean
          position: string
          scope: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          board_id: string
          created_at?: string
          for_date?: string
          id?: string
          is_done?: boolean
          position?: string
          scope?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          board_id?: string
          created_at?: string
          for_date?: string
          id?: string
          is_done?: boolean
          position?: string
          scope?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      epics: {
        Row: {
          arc_id: string | null
          archived_at: string | null
          assignee_id: string | null
          board_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          position: string
          priority: Database["public"]["Enums"]["item_priority"]
          status_id: string | null
          title: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          arc_id?: string | null
          archived_at?: string | null
          assignee_id?: string | null
          board_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position?: string
          priority?: Database["public"]["Enums"]["item_priority"]
          status_id?: string | null
          title: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          arc_id?: string | null
          archived_at?: string | null
          assignee_id?: string | null
          board_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position?: string
          priority?: Database["public"]["Enums"]["item_priority"]
          status_id?: string | null
          title?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      github_connections: {
        Row: {
          connected_at: string
          github_username: string | null
          id: string
          installation_id: string | null
          repo_full_name: string | null
          share_to_boards: boolean
          token_secret_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          github_username?: string | null
          id?: string
          installation_id?: string | null
          repo_full_name?: string | null
          share_to_boards?: boolean
          token_secret_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          github_username?: string | null
          id?: string
          installation_id?: string | null
          repo_full_name?: string | null
          share_to_boards?: boolean
          token_secret_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          board_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["board_role"]
          status: Database["public"]["Enums"]["invite_status"]
          team_id: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          board_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["board_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          team_id?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          board_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["board_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          team_id?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      leetping_events: {
        Row: {
          board_id: string
          commit_sha: string
          committed_at: string | null
          created_at: string
          difficulty: string | null
          id: string
          language: string | null
          problem_slug: string | null
          problem_title: string | null
          problem_url: string | null
          repo_full_name: string | null
          user_id: string
        }
        Insert: {
          board_id: string
          commit_sha: string
          committed_at?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string | null
          problem_slug?: string | null
          problem_title?: string | null
          problem_url?: string | null
          repo_full_name?: string | null
          user_id: string
        }
        Update: {
          board_id?: string
          commit_sha?: string
          committed_at?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          language?: string | null
          problem_slug?: string | null
          problem_title?: string | null
          problem_url?: string | null
          repo_full_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          github_username: string | null
          handle: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          github_username?: string | null
          handle?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          github_username?: string | null
          handle?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sprints: {
        Row: {
          arc_id: string
          board_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          start_date: string | null
        }
        Insert: {
          arc_id: string
          board_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          start_date?: string | null
        }
        Update: {
          arc_id?: string
          board_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          start_date?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: string | null
          assignee_id: string | null
          board_id: string
          created_at: string
          created_by: string | null
          description: string | null
          epic_id: string
          id: string
          is_blocker: boolean
          position: string
          priority: Database["public"]["Enums"]["item_priority"]
          sprint_id: string | null
          status_id: string | null
          tags: string[]
          title: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assignee_id?: string | null
          board_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id: string
          id?: string
          is_blocker?: boolean
          position?: string
          priority?: Database["public"]["Enums"]["item_priority"]
          sprint_id?: string | null
          status_id?: string | null
          tags?: string[]
          title: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assignee_id?: string | null
          board_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          epic_id?: string
          id?: string
          is_blocker?: boolean
          position?: string
          priority?: Database["public"]["Enums"]["item_priority"]
          sprint_id?: string | null
          status_id?: string | null
          tags?: string[]
          title?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      work_item_types: {
        Row: {
          board_id: string
          color: string | null
          icon: string | null
          id: string
          name: string
          position: number
        }
        Insert: {
          board_id: string
          color?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
        }
        Update: {
          board_id?: string
          color?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
    }
    Views: {
      epic_rollups: {
        Row: {
          board_id: string | null
          done_count: number | null
          epic_id: string | null
          pct_done: number | null
          task_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: string }
      close_sprint: {
        Args: { p_sprint: string; p_move_incomplete?: boolean }
        Returns: string | null
      }
      create_arc: {
        Args: {
          p_board: string
          p_arc_size?: number
          p_sprint_length?: number
          p_start?: string
        }
        Returns: string
      }
      board_role: {
        Args: { b: string }
        Returns: Database["public"]["Enums"]["board_role"]
      }
      board_roster: {
        Args: { p_board: string }
        Returns: {
          avatar_url: string
          display_name: string
          handle: string
          role: Database["public"]["Enums"]["board_role"]
          team_id: string
          user_id: string
        }[]
      }
      can_edit: { Args: { b: string }; Returns: boolean }
      create_board: {
        Args: { p_arc_size: number; p_name: string; p_sprint_length: number }
        Returns: string
      }
      is_board_member: { Args: { b: string }; Returns: boolean }
      is_board_owner: { Args: { b: string }; Returns: boolean }
      leaderboard: {
        Args: { p_board: string; p_sprint?: string }
        Returns: {
          active: number
          assigned: number
          completion: number
          display_name: string
          done: number
          momentum: number
          priority: number
          team_id: string
          todo: number
          total: number
          user_id: string
        }[]
      }
      move_task: {
        Args: { p_item: string; p_position: string; p_status: string | null }
        Returns: undefined
      }
      reorder_statuses: {
        Args: { p_board: string; p_ids: string[] }
        Returns: undefined
      }
      reparent_epic_tasks: {
        Args: { p_from: string; p_to: string }
        Returns: number
      }
      shares_board_with: { Args: { target: string }; Returns: boolean }
    }
    Enums: {
      board_role: "owner" | "editor" | "viewer"
      invite_status: "pending" | "accepted" | "revoked" | "expired"
      item_priority: "critical" | "high" | "medium" | "low"
      status_category: "todo" | "in_progress" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      board_role: ["owner", "editor", "viewer"],
      invite_status: ["pending", "accepted", "revoked", "expired"],
      item_priority: ["critical", "high", "medium", "low"],
      status_category: ["todo", "in_progress", "done"],
    },
  },
} as const
