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
      advisor_conversations: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      career_recommendations: {
        Row: {
          career_title: string
          confidence_score: number | null
          created_at: string | null
          id: string
          rationale: string | null
          user_id: string
        }
        Insert: {
          career_title: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          rationale?: string | null
          user_id: string
        }
        Update: {
          career_title?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          rationale?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string | null
          id: string
          issuer: string | null
          title: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          issuer?: string | null
          title?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          issuer?: string | null
          title?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      education_details: {
        Row: {
          created_at: string | null
          degree: string | null
          field: string | null
          graduation_year: number | null
          id: string
          institution: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          field?: string | null
          graduation_year?: number | null
          id?: string
          institution?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          field?: string | null
          graduation_year?: number | null
          id?: string
          institution?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experience_details: {
        Row: {
          company: string | null
          created_at: string | null
          end_year: number | null
          id: string
          role: string | null
          skills: string[] | null
          start_year: number | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          end_year?: number | null
          id?: string
          role?: string | null
          skills?: string[] | null
          start_year?: number | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          end_year?: number | null
          id?: string
          role?: string | null
          skills?: string[] | null
          start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      job_readiness: {
        Row: {
          confidence_level: number | null
          id: string
          portfolio_ready: boolean | null
          resume_ready: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          id?: string
          portfolio_ready?: boolean | null
          resume_ready?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          id?: string
          portfolio_ready?: boolean | null
          resume_ready?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_plan: {
        Row: {
          created_at: string | null
          id: string
          priority: number | null
          skill_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority?: number | null
          skill_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          priority?: number | null
          skill_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          career_title: string
          description: string | null
          difficulty: string | null
          id: string
          project_title: string
          skills_covered: string[] | null
        }
        Insert: {
          career_title: string
          description?: string | null
          difficulty?: string | null
          id?: string
          project_title: string
          skills_covered?: string[] | null
        }
        Update: {
          career_title?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          project_title?: string
          skills_covered?: string[] | null
        }
        Relationships: []
      }
      selected_career: {
        Row: {
          career_title: string
          id: string
          industry: string | null
          selected_at: string | null
          user_id: string
        }
        Insert: {
          career_title: string
          id?: string
          industry?: string | null
          selected_at?: string | null
          user_id: string
        }
        Update: {
          career_title?: string
          id?: string
          industry?: string | null
          selected_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      skill_catalog: {
        Row: {
          category: string | null
          description: string | null
          id: string
          skill_name: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          skill_name: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          skill_name?: string
        }
        Relationships: []
      }
      user_journey_state: {
        Row: {
          career_recommended: boolean | null
          career_selected: boolean | null
          interview_completed: boolean | null
          job_ready: boolean | null
          learning_completed: boolean | null
          profile_completed: boolean | null
          projects_completed: boolean | null
          skill_validated: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_recommended?: boolean | null
          career_selected?: boolean | null
          interview_completed?: boolean | null
          job_ready?: boolean | null
          learning_completed?: boolean | null
          profile_completed?: boolean | null
          projects_completed?: boolean | null
          skill_validated?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_recommended?: boolean | null
          career_selected?: boolean | null
          interview_completed?: boolean | null
          job_ready?: boolean | null
          learning_completed?: boolean | null
          profile_completed?: boolean | null
          projects_completed?: boolean | null
          skill_validated?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_learning_journey: {
        Row: {
          career_title: string
          certification_links: string[] | null
          created_at: string | null
          id: string
          learning_steps: Json | null
          recommended_courses: Json | null
          recommended_videos: Json | null
          skill_name: string
          status: string | null
          steps_completed: boolean[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_title: string
          certification_links?: string[] | null
          created_at?: string | null
          id?: string
          learning_steps?: Json | null
          recommended_courses?: Json | null
          recommended_videos?: Json | null
          skill_name: string
          status?: string | null
          steps_completed?: boolean[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_title?: string
          certification_links?: string[] | null
          created_at?: string | null
          id?: string
          learning_steps?: Json | null
          recommended_courses?: Json | null
          recommended_videos?: Json | null
          skill_name?: string
          status?: string | null
          steps_completed?: boolean[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_project_steps: {
        Row: {
          ai_tools: Json
          build_completed: boolean[] | null
          build_steps: Json
          created_at: string | null
          id: string
          plan_completed: boolean[] | null
          plan_steps: Json
          updated_at: string | null
          user_id: string
          user_project_id: string
        }
        Insert: {
          ai_tools?: Json
          build_completed?: boolean[] | null
          build_steps?: Json
          created_at?: string | null
          id?: string
          plan_completed?: boolean[] | null
          plan_steps?: Json
          updated_at?: string | null
          user_id: string
          user_project_id: string
        }
        Update: {
          ai_tools?: Json
          build_completed?: boolean[] | null
          build_steps?: Json
          created_at?: string | null
          id?: string
          plan_completed?: boolean[] | null
          plan_steps?: Json
          updated_at?: string | null
          user_id?: string
          user_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_project_steps_user_project_id_fkey"
            columns: ["user_project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_validation: {
        Row: {
          career_title: string
          created_at: string | null
          current_level: string | null
          id: string
          required_level: string | null
          skill_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          career_title: string
          created_at?: string | null
          current_level?: string | null
          id?: string
          required_level?: string | null
          skill_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          career_title?: string
          created_at?: string | null
          current_level?: string | null
          id?: string
          required_level?: string | null
          skill_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          activities: string[] | null
          created_at: string | null
          goal_description: string | null
          goal_type: string | null
          hobbies: string[] | null
          id: string
          interests: string[] | null
          updated_at: string | null
        }
        Insert: {
          activities?: string[] | null
          created_at?: string | null
          goal_description?: string | null
          goal_type?: string | null
          hobbies?: string[] | null
          id: string
          interests?: string[] | null
          updated_at?: string | null
        }
        Update: {
          activities?: string[] | null
          created_at?: string | null
          goal_description?: string | null
          goal_type?: string | null
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
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
