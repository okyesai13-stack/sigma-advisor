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
      ai_conversations: {
        Row: {
          business_id: string | null
          busy_request: string | null
          created_at: string
          id: string
          legacy_business_id: string | null
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          business_id?: string | null
          busy_request?: string | null
          created_at?: string
          id?: string
          legacy_business_id?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          business_id?: string | null
          busy_request?: string | null
          created_at?: string
          id?: string
          legacy_business_id?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "ai_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          parts: Json
          request_id: string | null
          role: string
          sdk_id: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          parts: Json
          request_id?: string | null
          role: string
          sdk_id: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          parts?: Json
          request_id?: string | null
          role?: string
          sdk_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_operations_result: {
        Row: {
          business_id: string
          created_at: string
          defensibility: Json | null
          id: string
          quick_wins: Json | null
          readiness: Json | null
          roi: Json | null
          summary: string | null
          systemic_automations: Json | null
          tool_stack: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string
          defensibility?: Json | null
          id?: string
          quick_wins?: Json | null
          readiness?: Json | null
          roi?: Json | null
          summary?: string | null
          systemic_automations?: Json | null
          tool_stack?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string
          defensibility?: Json | null
          id?: string
          quick_wins?: Json | null
          readiness?: Json | null
          roi?: Json | null
          summary?: string | null
          systemic_automations?: Json | null
          tool_stack?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_operations_result_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_requests: {
        Row: {
          capabilities: Json
          conversation_id: string
          created_at: string
          error_message: string | null
          id: string
          intent: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capabilities?: Json
          conversation_id: string
          created_at?: string
          error_message?: string | null
          id: string
          intent?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capabilities?: Json
          conversation_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          intent?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          byte_size: number
          created_at: string
          file_name: string
          id: string
          mime_type: string
          project_id: string
          status: string
          storage_path: string
          task_id: string | null
          updated_at: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          project_id: string
          status?: string
          storage_path: string
          task_id?: string | null
          updated_at?: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          project_id?: string
          status?: string
          storage_path?: string
          task_id?: string | null
          updated_at?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "attachments_task_id_project_id_fkey"
            columns: ["task_id", "project_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "project_id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      collaboration_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          project_id: string | null
          task_id: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          project_id?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      credit_ledger: {
        Row: {
          action: string
          amount: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      idea_stress_test: {
        Row: {
          blind_spots: Json
          business_id: string
          created_at: string
          id: string
          killers: Json
          reason: string | null
          risks: Json
          score: number
          verdict: string | null
        }
        Insert: {
          blind_spots?: Json
          business_id: string
          created_at?: string
          id?: string
          killers?: Json
          reason?: string | null
          risks?: Json
          score?: number
          verdict?: string | null
        }
        Update: {
          blind_spots?: Json
          business_id?: string
          created_at?: string
          id?: string
          killers?: Json
          reason?: string | null
          risks?: Json
          score?: number
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_stress_test_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      lean_canvas: {
        Row: {
          boxes: Json
          business_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          boxes?: Json
          business_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          boxes?: Json
          business_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lean_canvas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
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
      marketing_strategy_result: {
        Row: {
          budget: Json | null
          business_id: string
          campaigns: Json | null
          channels: Json | null
          content_pillars: Json | null
          created_at: string
          id: string
          kpis: Json | null
          personas: Json | null
          positioning: Json | null
          roadmap_90_days: Json | null
          summary: string | null
        }
        Insert: {
          budget?: Json | null
          business_id: string
          campaigns?: Json | null
          channels?: Json | null
          content_pillars?: Json | null
          created_at?: string
          id?: string
          kpis?: Json | null
          personas?: Json | null
          positioning?: Json | null
          roadmap_90_days?: Json | null
          summary?: string | null
        }
        Update: {
          budget?: Json | null
          business_id?: string
          campaigns?: Json | null
          channels?: Json | null
          content_pillars?: Json | null
          created_at?: string
          id?: string
          kpis?: Json | null
          personas?: Json | null
          positioning?: Json | null
          roadmap_90_days?: Json | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_strategy_result_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_tasks: {
        Row: {
          created_at: string
          id: string
          milestone_id: string
          project_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          milestone_id: string
          project_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          milestone_id?: string
          project_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_tasks_milestone_id_project_id_fkey"
            columns: ["milestone_id", "project_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id", "project_id"]
          },
          {
            foreignKeyName: "milestone_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_tasks_task_id_project_id_fkey"
            columns: ["task_id", "project_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      milestones: {
        Row: {
          completion_date: string | null
          completion_override_reason: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          owner_id: string | null
          project_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          completion_date?: string | null
          completion_override_reason?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          project_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          completion_date?: string | null
          completion_override_reason?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          owner_id?: string | null
          project_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "milestones_workspace_id_owner_id_fkey"
            columns: ["workspace_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          attempts: number
          body: string
          category: string
          created_at: string
          error: string | null
          event_key: string
          id: string
          link: string
          next_attempt_at: string
          provider_id: string | null
          recipient_email: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          attempts?: number
          body: string
          category: string
          created_at?: string
          error?: string | null
          event_key: string
          id?: string
          link: string
          next_attempt_at?: string
          provider_id?: string | null
          recipient_email: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          attempts?: number
          body?: string
          category?: string
          created_at?: string
          error?: string | null
          event_key?: string
          id?: string
          link?: string
          next_attempt_at?: string
          provider_id?: string | null
          recipient_email?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: Json
          in_app: Json
          milestone_reminder_days: number
          project_reminder_days: number
          task_reminder_days: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: Json
          in_app?: Json
          milestone_reminder_days?: number
          project_reminder_days?: number
          task_reminder_days?: number
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: Json
          in_app?: Json
          milestone_reminder_days?: number
          project_reminder_days?: number
          task_reminder_days?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          event_key: string
          id: string
          link: string
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          body?: string
          category: string
          created_at?: string
          event_key: string
          id?: string
          link: string
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          event_key?: string
          id?: string
          link?: string
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "project_members_workspace_id_user_id_fkey"
            columns: ["workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      project_schedule_activity: {
        Row: {
          actor_id: string | null
          changes: Json
          created_at: string
          event: string
          id: string
          project_id: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          changes?: Json
          created_at?: string
          event: string
          id?: string
          project_id: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          changes?: Json
          created_at?: string
          event?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedule_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedule_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          name: string
          owner_id: string
          priority: string
          start_date: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          name: string
          owner_id: string
          priority?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string
          priority?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_owner_id_fkey"
            columns: ["workspace_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      startup_roadmap: {
        Row: {
          business_id: string
          created_at: string
          goal: string | null
          id: string
          phases: Json
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          goal?: string | null
          id?: string
          phases?: Json
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          goal?: string | null
          id?: string
          phases?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_roadmap_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_store"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity_logs: {
        Row: {
          actor_id: string | null
          changes: Json
          created_at: string
          event: string
          id: string
          project_id: string
          task_id: string | null
          task_title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          changes?: Json
          created_at?: string
          event: string
          id?: string
          project_id: string
          task_id?: string | null
          task_title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          changes?: Json
          created_at?: string
          event?: string
          id?: string
          project_id?: string
          task_id?: string | null
          task_title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          edited: boolean
          id: string
          mention_ids: string[]
          parent_id: string | null
          project_id: string
          task_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          edited?: boolean
          id?: string
          mention_ids?: string[]
          parent_id?: string | null
          project_id: string
          task_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          edited?: boolean
          id?: string
          mention_ids?: string[]
          parent_id?: string | null
          project_id?: string
          task_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_parent_id_task_id_fkey"
            columns: ["parent_id", "task_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id", "task_id"]
          },
          {
            foreignKeyName: "task_comments_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_project_id_fkey"
            columns: ["task_id", "project_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          created_by: string
          dependency_type: string
          id: string
          predecessor_task_id: string
          project_id: string
          successor_task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          dependency_type?: string
          id?: string
          predecessor_task_id: string
          project_id: string
          successor_task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dependency_type?: string
          id?: string
          predecessor_task_id?: string
          project_id?: string
          successor_task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_predecessor_task_id_project_id_fkey"
            columns: ["predecessor_task_id", "project_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "project_id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_successor_task_id_project_id_fkey"
            columns: ["successor_task_id", "project_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_effort: number | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          estimated_effort: number | null
          id: string
          priority: string
          project_id: string
          start_date: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          actual_effort?: number | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          estimated_effort?: number | null
          id?: string
          priority?: string
          project_id: string
          start_date?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          actual_effort?: number | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          estimated_effort?: number | null
          id?: string
          priority?: string
          project_id?: string
          start_date?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_assignee_id_fkey"
            columns: ["workspace_id", "assignee_id"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["workspace_id", "user_id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string
          daily_balance: number
          daily_reset_at: string
          monthly_balance: number
          monthly_reset_at: string
          plan: string
          topup_balance: number
          updated_at: string
          upgrade_requested_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_balance?: number
          daily_reset_at?: string
          monthly_balance?: number
          monthly_reset_at?: string
          plan?: string
          topup_balance?: number
          updated_at?: string
          upgrade_requested_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          daily_balance?: number
          daily_reset_at?: string
          monthly_balance?: number
          monthly_reset_at?: string
          plan?: string
          topup_balance?: number
          updated_at?: string
          upgrade_requested_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          message: string
          role: string
          status: string
          token_hash: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          message?: string
          role: string
          status?: string
          token_hash: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          message?: string
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          attachment_limit_bytes: number
          created_at: string
          id: string
          kind: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          attachment_limit_bytes?: number
          created_at?: string
          id?: string
          kind?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          attachment_limit_bytes?: number
          created_at?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
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
      accept_workspace_invitation: {
        Args: { p_token: string }
        Returns: string
      }
      begin_ai_request: {
        Args: { p_conversation: string; p_id: string; p_user: string }
        Returns: boolean
      }
      claim_collaboration_emails: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          body: string
          category: string
          created_at: string
          error: string | null
          event_key: string
          id: string
          link: string
          next_attempt_at: string
          provider_id: string | null
          recipient_email: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_workspace: {
        Args: { p_kind?: string; p_name: string }
        Returns: string
      }
      credit_cost: { Args: { p_action: string }; Returns: number }
      duplicate_project: { Args: { p_project: string }; Returns: string }
      enqueue_notification: {
        Args: {
          p_body: string
          p_category: string
          p_key: string
          p_link: string
          p_title: string
          p_user: string
          p_workspace: string
        }
        Returns: undefined
      }
      finish_attachment: { Args: { p_id: string }; Returns: undefined }
      get_my_credits: {
        Args: never
        Returns: {
          created_at: string
          daily_balance: number
          daily_reset_at: string
          monthly_balance: number
          monthly_reset_at: string
          plan: string
          topup_balance: number
          updated_at: string
          upgrade_requested_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invite_workspace_member: {
        Args: {
          p_email: string
          p_message?: string
          p_role: string
          p_workspace: string
        }
        Returns: Json
      }
      manage_workspace_member: {
        Args: { p_email: string; p_role: string; p_workspace: string }
        Returns: undefined
      }
      mark_notifications: {
        Args: { p_id?: string; p_read?: boolean }
        Returns: undefined
      }
      process_deadline_reminders: { Args: never; Returns: number }
      redeem_coupon: { Args: { p_code: string }; Returns: undefined }
      refresh_credits: {
        Args: { p_user: string }
        Returns: {
          created_at: string
          daily_balance: number
          daily_reset_at: string
          monthly_balance: number
          monthly_reset_at: string
          plan: string
          topup_balance: number
          updated_at: string
          upgrade_requested_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_attachment: {
        Args: { p_finish?: boolean; p_id: string }
        Returns: undefined
      }
      request_upgrade: { Args: never; Returns: undefined }
      reserve_attachment: {
        Args: {
          p_mime: string
          p_name: string
          p_project: string
          p_size: number
          p_task: string
        }
        Returns: {
          byte_size: number
          created_at: string
          file_name: string
          id: string
          mime_type: string
          project_id: string
          status: string
          storage_path: string
          task_id: string | null
          updated_at: string
          uploaded_by: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "attachments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_workspace_invitation: {
        Args: { p_id: string }
        Returns: undefined
      }
      save_milestone: {
        Args: {
          p_id?: string
          p_task_ids: string[]
          p_values: Json
          p_version?: number
        }
        Returns: string
      }
      spend_credits: {
        Args: { p_action: string }
        Returns: {
          created_at: string
          daily_balance: number
          daily_reset_at: string
          monthly_balance: number
          monthly_reset_at: string
          plan: string
          topup_balance: number
          updated_at: string
          upgrade_requested_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      team_directory: {
        Args: { p_workspace: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          joined_at: string
          role: string
          user_id: string
        }[]
      }
      workspace_analytics: {
        Args: {
          p_from: string
          p_limit?: number
          p_member?: string
          p_offset?: number
          p_priority?: string
          p_project?: string
          p_status?: string
          p_to: string
          p_today: string
          p_workspace: string
        }
        Returns: Json
      }
      workspace_role: { Args: { p_workspace: string }; Returns: string }
      workspace_roster: {
        Args: { p_workspace: string }
        Returns: {
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
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
