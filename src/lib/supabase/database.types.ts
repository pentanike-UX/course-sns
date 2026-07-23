export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          route_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          route_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legs: {
        Row: {
          caution: string | null
          duration_min: number | null
          from_spot_id: string
          id: string
          route_id: string
          to_spot_id: string
          transport: Database["public"]["Enums"]["transport_mode"]
        }
        Insert: {
          caution?: string | null
          duration_min?: number | null
          from_spot_id: string
          id?: string
          route_id: string
          to_spot_id: string
          transport?: Database["public"]["Enums"]["transport_mode"]
        }
        Update: {
          caution?: string | null
          duration_min?: number | null
          from_spot_id?: string
          id?: string
          route_id?: string
          to_spot_id?: string
          transport?: Database["public"]["Enums"]["transport_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "legs_from_spot_id_fkey"
            columns: ["from_spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legs_to_spot_id_fkey"
            columns: ["to_spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          route_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          route_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          route_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_copies: {
        Row: {
          copied_route_id: string
          copier_id: string
          created_at: string
          id: string
          original_route_id: string | null
          purpose: Database["public"]["Enums"]["route_copy_purpose"]
        }
        Insert: {
          copied_route_id: string
          copier_id: string
          created_at?: string
          id?: string
          original_route_id?: string | null
          purpose: Database["public"]["Enums"]["route_copy_purpose"]
        }
        Update: {
          copied_route_id?: string
          copier_id?: string
          created_at?: string
          id?: string
          original_route_id?: string | null
          purpose?: Database["public"]["Enums"]["route_copy_purpose"]
        }
        Relationships: [
          {
            foreignKeyName: "route_copies_copied_route_id_fkey"
            columns: ["copied_route_id"]
            isOneToOne: true
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_copies_copier_id_fkey"
            columns: ["copier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_copies_original_route_id_fkey"
            columns: ["original_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_visibility: Database["public"]["Enums"]["visibility"]
          display_name: string
          handle: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_visibility?: Database["public"]["Enums"]["visibility"]
          display_name: string
          handle: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_visibility?: Database["public"]["Enums"]["visibility"]
          display_name?: string
          handle?: string
          id?: string
        }
        Relationships: [        ]
      }
      route_completions: {
        Row: {
          completer_id: string
          created_at: string
          id: string
          original_route_id: string
          rating: number | null
          route_copy_id: string | null
          tip: string | null
          updated_at: string
        }
        Insert: {
          completer_id: string
          created_at?: string
          id?: string
          original_route_id: string
          rating?: number | null
          route_copy_id?: string | null
          tip?: string | null
          updated_at?: string
        }
        Update: {
          completer_id?: string
          created_at?: string
          id?: string
          original_route_id?: string
          rating?: number | null
          route_copy_id?: string | null
          tip?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_completions_completer_id_fkey"
            columns: ["completer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_completions_original_route_id_fkey"
            columns: ["original_route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_completions_route_copy_id_fkey"
            columns: ["route_copy_id"]
            isOneToOne: false
            referencedRelation: "route_copies"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          author_id: string
          best_season: string | null
          bookmark_count: number
          comment_count: number
          completion_count: number
          completion_rating_count: number
          completion_rating_sum: number
          copy_count: number
          cover_photo_url: string | null
          created_at: string
          difficulty: string | null
          est_cost_krw: number | null
          id: string
          like_count: number
          mood: string | null
          recommended_for: string | null
          region: string
          theme: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          author_id: string
          best_season?: string | null
          bookmark_count?: number
          comment_count?: number
          completion_count?: number
          completion_rating_count?: number
          completion_rating_sum?: number
          copy_count?: number
          cover_photo_url?: string | null
          created_at?: string
          difficulty?: string | null
          est_cost_krw?: number | null
          id?: string
          like_count?: number
          mood?: string | null
          recommended_for?: string | null
          region: string
          theme?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          author_id?: string
          best_season?: string | null
          bookmark_count?: number
          comment_count?: number
          completion_count?: number
          completion_rating_count?: number
          completion_rating_sum?: number
          copy_count?: number
          cover_photo_url?: string | null
          created_at?: string
          difficulty?: string | null
          est_cost_krw?: number | null
          id?: string
          like_count?: number
          mood?: string | null
          recommended_for?: string | null
          region?: string
          theme?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "routes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_photos: {
        Row: {
          alt: string | null
          id: string
          order_index: number
          spot_id: string
          storage_path: string
        }
        Insert: {
          alt?: string | null
          id?: string
          order_index?: number
          spot_id: string
          storage_path: string
        }
        Update: {
          alt?: string | null
          id?: string
          order_index?: number
          spot_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_photos_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spots: {
        Row: {
          address: string
          body: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          order_index: number
          route_id: string
          title: string
        }
        Insert: {
          address?: string
          body?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          order_index: number
          route_id: string
          title: string
        }
        Update: {
          address?: string
          body?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          order_index?: number
          route_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "spots_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_type:
        | "like"
        | "comment"
        | "follow"
        | "completion"
        | "copy"
        | "course_publish"
      route_copy_purpose: "plan" | "record"
      transport_mode:
        | "walk"
        | "bus"
        | "subway"
        | "car"
        | "taxi"
        | "bike"
        | "train"
        | "other"
      visibility: "private" | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: [
        "like",
        "comment",
        "follow",
        "completion",
        "copy",
        "course_publish",
      ],
      transport_mode: [
        "walk",
        "bus",
        "subway",
        "car",
        "taxi",
        "bike",
        "train",
        "other",
      ],
      visibility: ["private", "public"],
    },
  },
} as const
