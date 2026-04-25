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
      assessment_scores: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          score: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          score?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          score?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          avg_score: number | null
          completion_rate: number | null
          created_at: string
          id: string
          notes: string | null
          session_id: string
          total_marks: number | null
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Insert: {
          avg_score?: number | null
          completion_rate?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id: string
          total_marks?: number | null
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Update: {
          avg_score?: number | null
          completion_rate?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string
          total_marks?: number | null
          type?: Database["public"]["Enums"]["assessment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          description: string | null
          file_name: string
          file_url: string
          id: string
          topic_id: string
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          topic_id: string
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          topic_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          id: string
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          date: string
          day_of_week: string
          end_time: string
          id: string
          start_time: string
          subject_id: string
          week_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_of_week: string
          end_time: string
          id?: string
          start_time: string
          subject_id: string
          week_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_of_week?: string
          end_time?: string
          id?: string
          start_time?: string
          subject_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          full_name: string
          id: string
          roll_number: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          roll_number: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          roll_number?: string
        }
        Relationships: []
      }
      subject_templates: {
        Row: {
          chapter_number: string
          created_at: string
          id: string
          notes: string | null
          sort_order: number
          subject_id: string
          topic_title: string
        }
        Insert: {
          chapter_number: string
          created_at?: string
          id?: string
          notes?: string | null
          sort_order?: number
          subject_id: string
          topic_title: string
        }
        Update: {
          chapter_number?: string
          created_at?: string
          id?: string
          notes?: string | null
          sort_order?: number
          subject_id?: string
          topic_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_templates_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          language_type: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_type?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          language_type?: string | null
          name?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          chapter_number: string | null
          created_at: string
          id: string
          notes: string | null
          part_number: number | null
          session_id: string
          status: Database["public"]["Enums"]["topic_status"]
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          part_number?: number | null
          session_id: string
          status?: Database["public"]["Enums"]["topic_status"]
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          part_number?: number | null
          session_id?: string
          status?: Database["public"]["Enums"]["topic_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      weeks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          label: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          label: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          start_date?: string
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
      assessment_type: "Quiz" | "Assignment" | "Test"
      attendance_status: "present" | "absent"
      topic_status: "not_started" | "in_progress" | "completed"
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
      assessment_type: ["Quiz", "Assignment", "Test"],
      attendance_status: ["present", "absent"],
      topic_status: ["not_started", "in_progress", "completed"],
    },
  },
} as const
