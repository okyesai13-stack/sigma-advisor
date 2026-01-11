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
      advisor_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      advisor_conversations: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          message: string
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message: string
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "advisor_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_job_recommendations: {
        Row: {
          career_role: string
          company_name: string
          created_at: string
          domain: string | null
          id: string
          is_saved: boolean
          job_description: string | null
          job_link: string | null
          job_title: string
          location: string | null
          relevance_score: number
          required_skills: string[] | null
          selected_job: boolean | null
          skill_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career_role: string
          company_name: string
          created_at?: string
          domain?: string | null
          id?: string
          is_saved?: boolean
          job_description?: string | null
          job_link?: string | null
          job_title: string
          location?: string | null
          relevance_score?: number
          required_skills?: string[] | null
          selected_job?: boolean | null
          skill_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career_role?: string
          company_name?: string
          created_at?: string
          domain?: string | null
          id?: string
          is_saved?: boolean
          job_description?: string | null
          job_link?: string | null
          job_title?: string
          location?: string | null
          relevance_score?: number
          required_skills?: string[] | null
          selected_job?: boolean | null
          skill_tags?: string[] | null
          updated_at?: string
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
      interview_preparation: {
        Row: {
          company: string | null
          created_at: string | null
          id: string
          interview_questions: Json
          job_analysis: Json
          job_id: string | null
          preparation_checklist: Json | null
          readiness_score: number | null
          resume_alignment: Json | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: string
          interview_questions: Json
          job_analysis: Json
          job_id?: string | null
          preparation_checklist?: Json | null
          readiness_score?: number | null
          resume_alignment?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: string
          interview_questions?: Json
          job_analysis?: Json
          job_id?: string | null
          preparation_checklist?: Json | null
          readiness_score?: number | null
          resume_alignment?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_preparation_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_job_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_build_steps: {
        Row: {
          created_at: string
          deliverables: string[] | null
          description: string
          estimated_duration: string | null
          id: string
          project_id: string
          status: string
          step_number: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deliverables?: string[] | null
          description: string
          estimated_duration?: string | null
          id?: string
          project_id: string
          status?: string
          step_number: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deliverables?: string[] | null
          description?: string
          estimated_duration?: string | null
          id?: string
          project_id?: string
          status?: string
          step_number?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_build_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      project_detail: {
        Row: {
          created_at: string
          id: string
          kanban_board: Json | null
          project_id: string
          tasks: Json | null
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kanban_board?: Json | null
          project_id: string
          tasks?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kanban_board?: Json | null
          project_id?: string
          tasks?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_detail_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ideas: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          problem: string | null
          selected_project: boolean | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          problem?: string | null
          selected_project?: boolean | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          problem?: string | null
          selected_project?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          quantity: number
          resource: string
          type: string
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          quantity?: number
          resource: string
          type: string
          unit_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          quantity?: number
          resource?: string
          type?: string
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_analysis: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          parsed_data: Json | null
          resume_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          parsed_data?: Json | null
          resume_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          parsed_data?: Json | null
          resume_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_career_advice: {
        Row: {
          career_advice: Json
          created_at: string
          id: string
          resume_analysis_id: string | null
          selected_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career_advice: Json
          created_at?: string
          id?: string
          resume_analysis_id?: string | null
          selected_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career_advice?: Json
          created_at?: string
          id?: string
          resume_analysis_id?: string | null
          selected_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_career_advice_resume_analysis_id_fkey"
            columns: ["resume_analysis_id"]
            isOneToOne: false
            referencedRelation: "resume_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          base_resume_id: string
          created_at: string | null
          id: string
          included_projects: string[] | null
          included_skills: string[] | null
          is_active: boolean | null
          resume_data: Json
          target_domain: string | null
          target_role: string | null
          updated_at: string | null
          user_id: string
          version_name: string | null
        }
        Insert: {
          base_resume_id: string
          created_at?: string | null
          id?: string
          included_projects?: string[] | null
          included_skills?: string[] | null
          is_active?: boolean | null
          resume_data: Json
          target_domain?: string | null
          target_role?: string | null
          updated_at?: string | null
          user_id: string
          version_name?: string | null
        }
        Update: {
          base_resume_id?: string
          created_at?: string | null
          id?: string
          included_projects?: string[] | null
          included_skills?: string[] | null
          is_active?: boolean | null
          resume_data?: Json
          target_domain?: string | null
          target_role?: string | null
          updated_at?: string | null
          user_id?: string
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_base_resume_id_fkey"
            columns: ["base_resume_id"]
            isOneToOne: false
            referencedRelation: "resume_analysis"
            referencedColumns: ["id"]
          },
        ]
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
      sigma_journey_state: {
        Row: {
          career_analysis_completed: boolean | null
          created_at: string | null
          interview_completed: boolean | null
          job_matching_completed: boolean | null
          learning_plan_completed: boolean | null
          profile_completed: boolean | null
          project_build_completed: boolean | null
          project_guidance_completed: boolean | null
          project_plan_completed: boolean | null
          resume_completed: boolean | null
          skill_validation_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_analysis_completed?: boolean | null
          created_at?: string | null
          interview_completed?: boolean | null
          job_matching_completed?: boolean | null
          learning_plan_completed?: boolean | null
          profile_completed?: boolean | null
          project_build_completed?: boolean | null
          project_guidance_completed?: boolean | null
          project_plan_completed?: boolean | null
          resume_completed?: boolean | null
          skill_validation_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_analysis_completed?: boolean | null
          created_at?: string | null
          interview_completed?: boolean | null
          job_matching_completed?: boolean | null
          learning_plan_completed?: boolean | null
          profile_completed?: boolean | null
          project_build_completed?: boolean | null
          project_guidance_completed?: boolean | null
          project_plan_completed?: boolean | null
          resume_completed?: boolean | null
          skill_validation_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      skill_validations: {
        Row: {
          career_id: string | null
          created_at: string
          domain: string | null
          id: string
          level: string | null
          matched_skills: Json | null
          missing_skills: Json | null
          readiness_score: number
          recommended_next_step: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          career_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          level?: string | null
          matched_skills?: Json | null
          missing_skills?: Json | null
          readiness_score?: number
          recommended_next_step?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          career_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          level?: string | null
          matched_skills?: Json | null
          missing_skills?: Json | null
          readiness_score?: number
          recommended_next_step?: string
          role?: string
          updated_at?: string
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
          user_type: string | null
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
          user_type?: string | null
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
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_sigma_journey_state: { Args: { p_user_id: string }; Returns: Json }
      update_sigma_state_flag: {
        Args: { p_flag_name: string; p_flag_value: boolean; p_user_id: string }
        Returns: undefined
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
