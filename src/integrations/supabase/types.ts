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
      career_analysis_result: {
        Row: {
          career_roadmap: Json | null
          career_roles: Json
          created_at: string
          id: string
          overall_assessment: string | null
          resume_id: string
          skill_analysis: Json | null
        }
        Insert: {
          career_roadmap?: Json | null
          career_roles?: Json
          created_at?: string
          id?: string
          overall_assessment?: string | null
          resume_id: string
          skill_analysis?: Json | null
        }
        Update: {
          career_roadmap?: Json | null
          career_roles?: Json
          created_at?: string
          id?: string
          overall_assessment?: string | null
          resume_id?: string
          skill_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "career_analysis_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      career_trajectory_result: {
        Row: {
          created_at: string
          id: string
          industry_insights: Json | null
          resume_id: string
          salary_projections: Json | null
          skill_milestones: Json | null
          trajectory_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          industry_insights?: Json | null
          resume_id: string
          salary_projections?: Json | null
          skill_milestones?: Json | null
          trajectory_data?: Json
        }
        Update: {
          created_at?: string
          id?: string
          industry_insights?: Json | null
          resume_id?: string
          salary_projections?: Json | null
          skill_milestones?: Json | null
          trajectory_data?: Json
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          resume_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          resume_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          resume_id?: string
          role?: string
        }
        Relationships: []
      }
      interview_preparation_result: {
        Row: {
          behavioral_questions: Json | null
          company_name: string
          company_specific_questions: Json | null
          created_at: string | null
          id: string
          job_id: string
          job_title: string
          key_talking_points: string[] | null
          preparation_tips: string[] | null
          resume_id: string
          technical_questions: Json | null
        }
        Insert: {
          behavioral_questions?: Json | null
          company_name: string
          company_specific_questions?: Json | null
          created_at?: string | null
          id?: string
          job_id: string
          job_title: string
          key_talking_points?: string[] | null
          preparation_tips?: string[] | null
          resume_id: string
          technical_questions?: Json | null
        }
        Update: {
          behavioral_questions?: Json | null
          company_name?: string
          company_specific_questions?: Json | null
          created_at?: string | null
          id?: string
          job_id?: string
          job_title?: string
          key_talking_points?: string[] | null
          preparation_tips?: string[] | null
          resume_id?: string
          technical_questions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_preparation_result_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_matching_result"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_preparation_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      job_matching_result: {
        Row: {
          career_role: string
          company_name: string
          created_at: string
          domain: string | null
          id: string
          is_saved: boolean | null
          job_description: string | null
          job_link: string | null
          job_title: string
          job_url: string | null
          location: string | null
          relevance_score: number | null
          required_skills: string[] | null
          resume_id: string
          skill_tags: string[] | null
        }
        Insert: {
          career_role: string
          company_name: string
          created_at?: string
          domain?: string | null
          id?: string
          is_saved?: boolean | null
          job_description?: string | null
          job_link?: string | null
          job_title: string
          job_url?: string | null
          location?: string | null
          relevance_score?: number | null
          required_skills?: string[] | null
          resume_id: string
          skill_tags?: string[] | null
        }
        Update: {
          career_role?: string
          company_name?: string
          created_at?: string
          domain?: string | null
          id?: string
          is_saved?: boolean | null
          job_description?: string | null
          job_link?: string | null
          job_title?: string
          job_url?: string | null
          location?: string | null
          relevance_score?: number | null
          required_skills?: string[] | null
          resume_id?: string
          skill_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_matching_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      journey_state: {
        Row: {
          career_analysis_completed: boolean | null
          created_at: string
          job_matching_completed: boolean | null
          learning_plan_completed: boolean | null
          project_ideas_completed: boolean | null
          resume_id: string
          skill_validation_completed: boolean | null
          updated_at: string
        }
        Insert: {
          career_analysis_completed?: boolean | null
          created_at?: string
          job_matching_completed?: boolean | null
          learning_plan_completed?: boolean | null
          project_ideas_completed?: boolean | null
          resume_id: string
          skill_validation_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          career_analysis_completed?: boolean | null
          created_at?: string
          job_matching_completed?: boolean | null
          learning_plan_completed?: boolean | null
          project_ideas_completed?: boolean | null
          resume_id?: string
          skill_validation_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_state_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: true
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      learning_content: {
        Row: {
          created_at: string
          flowchart_completed: boolean
          flowchart_data: Json | null
          id: string
          mind_map_completed: boolean
          mind_map_data: Json | null
          quiz_completed: boolean
          quiz_data: Json | null
          quiz_score: number | null
          resume_id: string
          skill_id: string
          skill_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flowchart_completed?: boolean
          flowchart_data?: Json | null
          id?: string
          mind_map_completed?: boolean
          mind_map_data?: Json | null
          quiz_completed?: boolean
          quiz_data?: Json | null
          quiz_score?: number | null
          resume_id: string
          skill_id: string
          skill_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flowchart_completed?: boolean
          flowchart_data?: Json | null
          id?: string
          mind_map_completed?: boolean
          mind_map_data?: Json | null
          quiz_completed?: boolean
          quiz_data?: Json | null
          quiz_score?: number | null
          resume_id?: string
          skill_id?: string
          skill_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_content_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "learning_plan_result"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plan_result: {
        Row: {
          career_title: string | null
          created_at: string
          id: string
          learning_steps: Json | null
          recommended_courses: Json | null
          recommended_videos: Json | null
          resume_id: string
          skill_name: string
          status: string | null
        }
        Insert: {
          career_title?: string | null
          created_at?: string
          id?: string
          learning_steps?: Json | null
          recommended_courses?: Json | null
          recommended_videos?: Json | null
          resume_id: string
          skill_name: string
          status?: string | null
        }
        Update: {
          career_title?: string | null
          created_at?: string
          id?: string
          learning_steps?: Json | null
          recommended_courses?: Json | null
          recommended_videos?: Json | null
          resume_id?: string
          skill_name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_plan_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      mock_interview_session: {
        Row: {
          answers: Json | null
          company_name: string
          completed_at: string | null
          created_at: string
          current_question_index: number | null
          id: string
          improvements: string[] | null
          interview_type: string
          job_id: string | null
          job_title: string
          overall_feedback: string | null
          overall_score: number | null
          questions: Json | null
          resume_id: string
          status: string
          strengths: string[] | null
          total_questions: number | null
        }
        Insert: {
          answers?: Json | null
          company_name: string
          completed_at?: string | null
          created_at?: string
          current_question_index?: number | null
          id?: string
          improvements?: string[] | null
          interview_type?: string
          job_id?: string | null
          job_title: string
          overall_feedback?: string | null
          overall_score?: number | null
          questions?: Json | null
          resume_id: string
          status?: string
          strengths?: string[] | null
          total_questions?: number | null
        }
        Update: {
          answers?: Json | null
          company_name?: string
          completed_at?: string | null
          created_at?: string
          current_question_index?: number | null
          id?: string
          improvements?: string[] | null
          interview_type?: string
          job_id?: string | null
          job_title?: string
          overall_feedback?: string | null
          overall_score?: number | null
          questions?: Json | null
          resume_id?: string
          status?: string
          strengths?: string[] | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_session_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_matching_result"
            referencedColumns: ["id"]
          },
        ]
      }
      project_build_session: {
        Row: {
          ai_guidance_history: Json
          code_snippets: Json
          completed_at: string | null
          completed_tasks: Json
          created_at: string
          current_phase: number
          current_task_index: number
          id: string
          phases: Json
          progress_percentage: number
          project_id: string
          project_title: string
          resume_id: string
          skills_applied: string[] | null
          started_at: string | null
          status: string
          total_phases: number
          updated_at: string
        }
        Insert: {
          ai_guidance_history?: Json
          code_snippets?: Json
          completed_at?: string | null
          completed_tasks?: Json
          created_at?: string
          current_phase?: number
          current_task_index?: number
          id?: string
          phases?: Json
          progress_percentage?: number
          project_id: string
          project_title: string
          resume_id: string
          skills_applied?: string[] | null
          started_at?: string | null
          status?: string
          total_phases?: number
          updated_at?: string
        }
        Update: {
          ai_guidance_history?: Json
          code_snippets?: Json
          completed_at?: string | null
          completed_tasks?: Json
          created_at?: string
          current_phase?: number
          current_task_index?: number
          id?: string
          phases?: Json
          progress_percentage?: number
          project_id?: string
          project_title?: string
          resume_id?: string
          skills_applied?: string[] | null
          started_at?: string | null
          status?: string
          total_phases?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_build_session_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_ideas_result"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ideas_result: {
        Row: {
          budget: number | null
          complexity: string | null
          created_at: string
          description: string | null
          domain: string | null
          estimated_time: string | null
          id: string
          problem: string | null
          resume_id: string
          skills_demonstrated: string[] | null
          title: string
        }
        Insert: {
          budget?: number | null
          complexity?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          estimated_time?: string | null
          id?: string
          problem?: string | null
          resume_id: string
          skills_demonstrated?: string[] | null
          title: string
        }
        Update: {
          budget?: number | null
          complexity?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          estimated_time?: string | null
          id?: string
          problem?: string | null
          resume_id?: string
          skills_demonstrated?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ideas_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      resume_store: {
        Row: {
          created_at: string
          file_name: string | null
          goal: string | null
          goal_type: string | null
          parsed_data: Json | null
          resume_file_url: string | null
          resume_id: string
          resume_text: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          goal?: string | null
          goal_type?: string | null
          parsed_data?: Json | null
          resume_file_url?: string | null
          resume_id?: string
          resume_text?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          goal?: string | null
          goal_type?: string | null
          parsed_data?: Json | null
          resume_file_url?: string | null
          resume_id?: string
          resume_text?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      skill_validation_result: {
        Row: {
          created_at: string
          id: string
          matched_skills: Json | null
          missing_skills: Json | null
          readiness_score: number | null
          recommended_next_step: string | null
          resume_id: string
          target_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_skills?: Json | null
          missing_skills?: Json | null
          readiness_score?: number | null
          recommended_next_step?: string | null
          resume_id: string
          target_role: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_skills?: Json | null
          missing_skills?: Json | null
          readiness_score?: number | null
          recommended_next_step?: string | null
          resume_id?: string
          target_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_validation_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      smart_analysis_result: {
        Row: {
          company_analysis: Json | null
          created_at: string | null
          id: string
          job_id: string
          overall_score: number | null
          recommendations: string[] | null
          resume_fit_analysis: Json | null
          resume_id: string
          role_analysis: Json | null
        }
        Insert: {
          company_analysis?: Json | null
          created_at?: string | null
          id?: string
          job_id: string
          overall_score?: number | null
          recommendations?: string[] | null
          resume_fit_analysis?: Json | null
          resume_id: string
          role_analysis?: Json | null
        }
        Update: {
          company_analysis?: Json | null
          created_at?: string | null
          id?: string
          job_id?: string
          overall_score?: number | null
          recommendations?: string[] | null
          resume_fit_analysis?: Json | null
          resume_id?: string
          role_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_analysis_result_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_matching_result"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_analysis_result_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_store"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      upgraded_resume_result: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          resume_data: Json
          resume_id: string
          target_role: string | null
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          resume_data?: Json
          resume_id: string
          target_role?: string | null
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          resume_data?: Json
          resume_id?: string
          target_role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_journey_state: { Args: { p_resume_id: string }; Returns: Json }
      get_sigma_journey_state: { Args: { p_user_id: string }; Returns: Json }
      update_journey_state_flag: {
        Args: {
          p_flag_name: string
          p_flag_value: boolean
          p_resume_id: string
        }
        Returns: undefined
      }
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
