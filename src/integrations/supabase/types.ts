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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advisor_messages: {
        Row: {
          business_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plan_result: {
        Row: {
          business_id: string
          business_model: Json | null
          created_at: string
          executive_summary: string | null
          go_to_market: Json | null
          id: string
          milestones: Json | null
          risks: Json | null
          team_needs: Json | null
          value_proposition: string | null
        }
        Insert: {
          business_id: string
          business_model?: Json | null
          created_at?: string
          executive_summary?: string | null
          go_to_market?: Json | null
          id?: string
          milestones?: Json | null
          risks?: Json | null
          team_needs?: Json | null
          value_proposition?: string | null
        }
        Update: {
          business_id?: string
          business_model?: Json | null
          created_at?: string
          executive_summary?: string | null
          go_to_market?: Json | null
          id?: string
          milestones?: Json | null
          risks?: Json | null
          team_needs?: Json | null
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_plan_result_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      business_store: {
        Row: {
          business_name: string
          created_at: string
          geography: string | null
          id: string
          industry: string | null
          pitch: string
          raw_context: string | null
          stage: string
          target_market: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          created_at?: string
          geography?: string | null
          id?: string
          industry?: string | null
          pitch: string
          raw_context?: string | null
          stage?: string
          target_market?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          created_at?: string
          geography?: string | null
          id?: string
          industry?: string | null
          pitch?: string
          raw_context?: string | null
          stage?: string
          target_market?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitor_analysis_result: {
        Row: {
          business_id: string
          competitors: Json | null
          created_at: string
          differentiation: Json | null
          id: string
          positioning: Json | null
          summary: string | null
          swot: Json | null
        }
        Insert: {
          business_id: string
          competitors?: Json | null
          created_at?: string
          differentiation?: Json | null
          id?: string
          positioning?: Json | null
          summary?: string | null
          swot?: Json | null
        }
        Update: {
          business_id?: string
          competitors?: Json | null
          created_at?: string
          differentiation?: Json | null
          id?: string
          positioning?: Json | null
          summary?: string | null
          swot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analysis_result_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_model_result: {
        Row: {
          business_id: string
          cost_structure: Json | null
          created_at: string
          funding_needs: Json | null
          id: string
          key_assumptions: Json | null
          projections_3yr: Json | null
          revenue_streams: Json | null
          summary: string | null
          unit_economics: Json | null
        }
        Insert: {
          business_id: string
          cost_structure?: Json | null
          created_at?: string
          funding_needs?: Json | null
          id?: string
          key_assumptions?: Json | null
          projections_3yr?: Json | null
          revenue_streams?: Json | null
          summary?: string | null
          unit_economics?: Json | null
        }
        Update: {
          business_id?: string
          cost_structure?: Json | null
          created_at?: string
          funding_needs?: Json | null
          id?: string
          key_assumptions?: Json | null
          projections_3yr?: Json | null
          revenue_streams?: Json | null
          summary?: string | null
          unit_economics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_model_result_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      market_research_result: {
        Row: {
          business_id: string
          created_at: string
          id: string
          market_size: Json | null
          opportunities: Json | null
          risks: Json | null
          summary: string | null
          tam_sam_som: Json | null
          target_audience: Json | null
          trends: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          market_size?: Json | null
          opportunities?: Json | null
          risks?: Json | null
          summary?: string | null
          tam_sam_som?: Json | null
          target_audience?: Json | null
          trends?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          market_size?: Json | null
          opportunities?: Json | null
          risks?: Json | null
          summary?: string | null
          tam_sam_som?: Json | null
          target_audience?: Json | null
          trends?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "market_research_result_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
