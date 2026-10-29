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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      generation_events: {
        Row: {
          client_key: string
          coverage: number | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          fallback_reason: string | null
          generated_by: string | null
          id: number
          input_tokens: number | null
          is_guest: boolean
          llm_model: string | null
          output_tokens: number | null
          pool_size: number | null
          prompt_version: string | null
          repairs: number | null
          status: string
          thinking_tokens: number | null
          user_id: string | null
        }
        Insert: {
          client_key: string
          coverage?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          fallback_reason?: string | null
          generated_by?: string | null
          id?: never
          input_tokens?: number | null
          is_guest: boolean
          llm_model?: string | null
          output_tokens?: number | null
          pool_size?: number | null
          prompt_version?: string | null
          repairs?: number | null
          status: string
          thinking_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          client_key?: string
          coverage?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          fallback_reason?: string | null
          generated_by?: string | null
          id?: never
          input_tokens?: number | null
          is_guest?: boolean
          llm_model?: string | null
          output_tokens?: number | null
          pool_size?: number | null
          prompt_version?: string | null
          repairs?: number | null
          status?: string
          thinking_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          id: number
          place_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: never
          place_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: never
          place_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_audit_log_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_images: {
        Row: {
          alt: string | null
          created_at: string
          credit: string
          id: string
          license: string
          place_id: string
          sort_order: number
          source_url: string | null
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          credit: string
          id?: string
          license: string
          place_id: string
          sort_order?: number
          source_url?: string | null
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          credit?: string
          id?: string
          license?: string
          place_id?: string
          sort_order?: number
          source_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_images_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_tags: {
        Row: {
          place_id: string
          tag_id: string
          weight: number
        }
        Insert: {
          place_id: string
          tag_id: string
          weight?: number
        }
        Update: {
          place_id?: string
          tag_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "place_tags_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          ai_filled_fields: string[]
          area: string | null
          best_time: string[]
          category: string
          close_time: string | null
          closed_days: number[]
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          google_place_id: string | null
          id: string
          image_credit: string | null
          image_license: string | null
          image_source_url: string | null
          last_verified_at: string | null
          lat: number | null
          lng: number | null
          meal_type: string[]
          name: string
          open_time: string | null
          opening_note: string | null
          osm_id: string | null
          phone: string | null
          price_level: number | null
          price_note: string | null
          search_text: string | null
          short_description: string | null
          slug: string
          sort_order: number
          source: string | null
          source_url: string | null
          status: string
          suitable_for: string[]
          ticket_price_vnd: number | null
          updated_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          visit_duration_min: number | null
          walking_intensity: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_filled_fields?: string[]
          area?: string | null
          best_time?: string[]
          category: string
          close_time?: string | null
          closed_days?: number[]
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          google_place_id?: string | null
          id?: string
          image_credit?: string | null
          image_license?: string | null
          image_source_url?: string | null
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          meal_type?: string[]
          name: string
          open_time?: string | null
          opening_note?: string | null
          osm_id?: string | null
          phone?: string | null
          price_level?: number | null
          price_note?: string | null
          search_text?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          source?: string | null
          source_url?: string | null
          status?: string
          suitable_for?: string[]
          ticket_price_vnd?: number | null
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          visit_duration_min?: number | null
          walking_intensity?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_filled_fields?: string[]
          area?: string | null
          best_time?: string[]
          category?: string
          close_time?: string | null
          closed_days?: number[]
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          google_place_id?: string | null
          id?: string
          image_credit?: string | null
          image_license?: string | null
          image_source_url?: string | null
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          meal_type?: string[]
          name?: string
          open_time?: string | null
          opening_note?: string | null
          osm_id?: string | null
          phone?: string | null
          price_level?: number | null
          price_note?: string | null
          search_text?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          source?: string | null
          source_url?: string | null
          status?: string
          suitable_for?: string[]
          ticket_price_vnd?: number | null
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          visit_duration_min?: number | null
          walking_intensity?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_places_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      start_points: {
        Row: {
          id: string
          lat: number
          lng: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          kind: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      trip_days: {
        Row: {
          created_at: string
          date: string | null
          day_index: number
          id: string
          note: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          day_index: number
          id?: string
          note?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          day_index?: number
          id?: string
          note?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_items: {
        Row: {
          added_by: string
          created_at: string
          duration_min: number | null
          id: string
          is_locked: boolean
          note: string | null
          place_id: string
          position: number
          reason: string | null
          slot: string
          start_time: string | null
          travel_distance_m: number | null
          travel_min_from_prev: number | null
          trip_day_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          added_by?: string
          created_at?: string
          duration_min?: number | null
          id?: string
          is_locked?: boolean
          note?: string | null
          place_id: string
          position: number
          reason?: string | null
          slot: string
          start_time?: string | null
          travel_distance_m?: number | null
          travel_min_from_prev?: number | null
          trip_day_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          duration_min?: number | null
          id?: string
          is_locked?: boolean
          note?: string | null
          place_id?: string
          position?: number
          reason?: string | null
          slot?: string
          start_time?: string | null
          travel_distance_m?: number | null
          travel_min_from_prev?: number | null
          trip_day_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_items_trip_day_id_fkey"
            columns: ["trip_day_id"]
            isOneToOne: false
            referencedRelation: "trip_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          client_draft_id: string | null
          created_at: string
          generated_by: string
          id: string
          input: Json
          is_shared: boolean
          llm_model: string | null
          num_days: number
          share_token: string | null
          start_date: string | null
          start_label: string | null
          start_lat: number | null
          start_lng: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_draft_id?: string | null
          created_at?: string
          generated_by?: string
          id?: string
          input: Json
          is_shared?: boolean
          llm_model?: string | null
          num_days: number
          share_token?: string | null
          start_date?: string | null
          start_label?: string | null
          start_lat?: number | null
          start_lng?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_draft_id?: string | null
          created_at?: string
          generated_by?: string
          id?: string
          input?: Json
          is_shared?: boolean
          llm_model?: string | null
          num_days?: number
          share_token?: string | null
          start_date?: string | null
          start_label?: string | null
          start_lat?: number | null
          start_lng?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_trip_from_payload: { Args: { p_payload: Json }; Returns: Json }
      f_unaccent: { Args: { "": string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      nearby_places: {
        Args: {
          p_exclude?: string[]
          p_lat: number
          p_limit?: number
          p_lng: number
        }
        Returns: {
          area: string
          category: string
          cover_image_alt: string
          cover_image_url: string
          distance_m: number
          id: string
          image_credit: string
          image_license: string
          lat: number
          lng: number
          name: string
          short_description: string
          slug: string
          verified: boolean
        }[]
      }
      save_trip: {
        Args: {
          p_expected_updated_at: string
          p_payload: Json
          p_trip_id: string
        }
        Returns: {
          client_draft_id: string | null
          created_at: string
          generated_by: string
          id: string
          input: Json
          is_shared: boolean
          llm_model: string | null
          num_days: number
          share_token: string | null
          start_date: string | null
          start_label: string | null
          start_lat: number | null
          start_lng: number | null
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "trips"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
