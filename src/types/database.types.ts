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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      affiliate_applications: {
        Row: {
          contact_name: string
          created_at: string
          designation: string
          email: string
          id: string
          interest_areas: string[]
          location: string
          message: string | null
          organization_name: string
          organization_type: string
          phone: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          designation: string
          email: string
          id?: string
          interest_areas: string[]
          location: string
          message?: string | null
          organization_name: string
          organization_type: string
          phone: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          designation?: string
          email?: string
          id?: string
          interest_areas?: string[]
          location?: string
          message?: string | null
          organization_name?: string
          organization_type?: string
          phone?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      ai_advisor_results: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          result: Json
          role: string
          skills: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          result: Json
          role: string
          skills?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          result?: Json
          role?: string
          skills?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      // ... (truncated for brevity - full types available in generated file)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_contact_info: { Args: never; Returns: boolean }
      check_esha_consent: {
        Args: { p_consent_type: string; p_user_id: string }
        Returns: boolean
      }
      // ... (truncated for brevity)
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

// Additional type helpers for Insert, Update, Enums, and CompositeTypes
// (Full implementation available in the complete generated file)