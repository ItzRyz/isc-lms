// Placeholder types — akan di-generate dari Supabase setelah migration
// Generate dengan: npx supabase gen types typescript --linked > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      divisions: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["divisions"]["Insert"]>;
      };
      user_divisions: {
        Row: { user_id: string; division_id: string; created_at: string };
        Insert: { user_id: string; division_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_divisions"]["Insert"]>;
      };
      classes: {
        Row: {
          id: string;
          division_id: string;
          academic_period_id: string | null;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          division_id: string;
          academic_period_id?: string | null;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };
      academic_periods: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["academic_periods"]["Insert"]>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; name: string; slug: string; description?: string | null; is_active?: boolean };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      batches: {
        Row: {
          id: string;
          name: string;
          slug: string;
          year: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: { id?: string; name: string; slug: string; year: number; description?: string | null; is_active?: boolean };
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
      };
      positions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: { id?: string; name: string; slug: string; description?: string | null; is_active?: boolean };
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>;
      };
      courses: {
        Row: {
          id: string;
          division_id: string;
          name: string;
          slug: string;
          description: string | null;
          is_published: boolean;
          scheduled_at: string | null;
          estimated_duration: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: { id?: string; division_id: string; name: string; slug: string; description?: string | null; is_published?: boolean; scheduled_at?: string | null; estimated_duration?: number | null };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
      };
      modules: {
        Row: { id: string; course_id: string; title: string; order_index: number; is_published: boolean; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: { id?: string; course_id: string; title: string; order_index: number; is_published?: boolean };
        Update: Partial<Database["public"]["Tables"]["modules"]["Insert"]>;
      };
      materials: {
        Row: {
          id: string;
          module_id: string;
          course_id: string;
          title: string;
          type: "DOCUMENT" | "EXTERNAL_LINK" | "VIDEO" | "ASSIGNMENT_REF" | "QUIZ_REF";
          content_url: string | null;
          storage_path: string | null;
          assignment_id: string | null;
          quiz_id: string | null;
          is_published: boolean;
          scheduled_at: string | null;
          estimated_duration: number | null;
          version: number;
          visibility: "PUBLIC" | "ENROLLED";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          module_id: string;
          course_id: string;
          title: string;
          type: "DOCUMENT" | "EXTERNAL_LINK" | "VIDEO" | "ASSIGNMENT_REF" | "QUIZ_REF";
          content_url?: string | null;
          storage_path?: string | null;
          assignment_id?: string | null;
          quiz_id?: string | null;
          is_published?: boolean;
          scheduled_at?: string | null;
          estimated_duration?: number | null;
          version?: number;
          visibility?: "PUBLIC" | "ENROLLED";
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
      };
      material_prerequisites: {
        Row: { material_id: string; prerequisite_id: string; created_at: string };
        Insert: { material_id: string; prerequisite_id: string };
        Update: Partial<Database["public"]["Tables"]["material_prerequisites"]["Insert"]>;
      };
      material_progress: {
        Row: { user_id: string; material_id: string; is_completed: boolean; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { user_id: string; material_id: string; is_completed?: boolean; completed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["material_progress"]["Insert"]>;
      };
      material_bookmarks: {
        Row: { user_id: string; material_id: string; created_at: string };
        Insert: { user_id: string; material_id: string };
        Update: Partial<Database["public"]["Tables"]["material_bookmarks"]["Insert"]>;
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          module_id: string | null;
          title: string;
          description: string | null;
          type: "INDIVIDUAL" | "GROUP";
          submission_type: "FILE" | "TEXT" | "FILE_AND_TEXT";
          due_at: string | null;
          allow_late: boolean;
          max_score: number;
          max_attempts: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          module_id?: string | null;
          title: string;
          description?: string | null;
          type?: "INDIVIDUAL" | "GROUP";
          submission_type?: "FILE" | "TEXT" | "FILE_AND_TEXT";
          due_at?: string | null;
          allow_late?: boolean;
          max_score?: number;
          max_attempts?: number;
          is_published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          assignment_group_id: string | null;
          user_id: string;
          status: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "LATE" | "GRADED" | "REVISION_REQUIRED" | "RESUBMITTED";
          content_text: string | null;
          score: number | null;
          feedback: string | null;
          submitted_at: string | null;
          graded_at: string | null;
          graded_by: string | null;
          attempt_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; assignment_id: string; user_id: string; status?: "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "LATE" | "GRADED" | "REVISION_REQUIRED" | "RESUBMITTED"; content_text?: string | null; score?: number | null; attempt_number?: number };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
      };
      assignment_groups: {
        Row: { id: string; assignment_id: string; name: string; created_at: string };
        Insert: { id?: string; assignment_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["assignment_groups"]["Insert"]>;
      };
      rubrics: {
        Row: { id: string; assignment_id: string; title: string; description: string | null; created_at: string };
        Insert: { id?: string; assignment_id: string; title: string; description?: string | null };
        Update: Partial<Database["public"]["Tables"]["rubrics"]["Insert"]>;
      };
      rubric_items: {
        Row: { id: string; rubric_id: string; criterion: string; max_points: number; order_index: number };
        Insert: { id?: string; rubric_id: string; criterion: string; max_points: number; order_index?: number };
        Update: Partial<Database["public"]["Tables"]["rubric_items"]["Insert"]>;
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          type: "ICE_BREAKING" | "WEEKLY" | "ASSESSMENT";
          duration_minutes: number;
          max_attempts: number;
          shuffle_questions: boolean;
          shuffle_choices: boolean;
          available_from: string | null;
          available_until: string | null;
          is_published: boolean;
          pass_score: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: { id?: string; course_id: string; title: string; description?: string | null; type?: "ICE_BREAKING" | "WEEKLY" | "ASSESSMENT"; duration_minutes?: number; max_attempts?: number; is_published?: boolean };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Insert"]>;
      };
      questions: {
        Row: {
          id: string;
          course_id: string | null;
          type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER";
          content: string;
          choices: { id: string; text: string; is_correct: boolean }[];
          explanation: string | null;
          points: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: { id?: string; course_id?: string | null; type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER"; content: string; choices: { id: string; text: string; is_correct: boolean }[]; points?: number };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
      };
      quiz_questions: {
        Row: { quiz_id: string; question_id: string; order_index: number; points_override: number | null; created_at: string };
        Insert: { quiz_id: string; question_id: string; order_index?: number; points_override?: number | null };
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Insert"]>;
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          attempt_number: number;
          status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";
          score: number | null;
          max_score: number | null;
          started_at: string;
          submitted_at: string | null;
          expires_at: string | null;
          time_spent_seconds: number | null;
        };
        Insert: { id?: string; quiz_id: string; user_id: string; attempt_number: number; status?: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED"; score?: number | null };
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Insert"]>;
      };
      quiz_answers: {
        Row: { id: string; attempt_id: string; question_id: string; selected_choice_ids: string[]; is_correct: boolean | null; points_earned: number | null; created_at: string };
        Insert: { id: string; attempt_id: string; question_id: string; selected_choice_ids: string[] };
        Update: Partial<Database["public"]["Tables"]["quiz_answers"]["Insert"]>;
      };
      attendance_sessions: {
        Row: {
          id: string;
          division_id: string | null;
          class_id: string | null;
          course_id: string | null;
          title: string;
          started_at: string;
          ended_at: string;
          latitude: number | null;
          longitude: number | null;
          radius_meters: number | null;
          qr_token: string;
          status: "OPEN" | "CLOSED" | "CANCELLED";
          created_by: string | null;
          created_at: string;
        };
        Insert: { id?: string; division_id?: string | null; class_id?: string | null; title?: string; started_at: string; ended_at: string; latitude?: number | null; longitude?: number | null; radius_meters?: number | null; qr_token?: string; status?: "OPEN" | "CLOSED" | "CANCELLED" };
        Update: Partial<Database["public"]["Tables"]["attendance_sessions"]["Insert"]>;
      };
      attendance_records: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          status: "PRESENT" | "LATE" | "PERMITTED" | "SICK" | "ABSENT";
          checked_in_at: string | null;
          latitude: number | null;
          longitude: number | null;
          distance_meters: number | null;
          is_geofence_valid: boolean | null;
          qr_token_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; session_id: string; user_id: string; status: "PRESENT" | "LATE" | "PERMITTED" | "SICK" | "ABSENT"; checked_in_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Insert"]>;
      };
      attendance_corrections: {
        Row: { id: string; record_id: string; old_status: string | null; new_status: string; reason: string; corrected_by: string | null; created_at: string };
        Insert: { id?: string; record_id: string; new_status: string; reason: string };
        Update: Partial<Database["public"]["Tables"]["attendance_corrections"]["Insert"]>;
      };
      audit_logs: {
        Row: { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string; old_value: unknown | null; new_value: unknown | null; created_at: string };
        Insert: { id?: string; actor_id?: string | null; action: string; entity_type: string; entity_id: string; old_value?: unknown | null; new_value?: unknown | null };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      point_transactions: {
        Row: { id: string; user_id: string; amount: number; type: "EARN" | "PENALTY" | "CORRECTION"; source_type: "QUIZ" | "ASSIGNMENT" | "ATTENDANCE" | "COMPETITION" | "PRACTICE" | "MANUAL"; source_id: string | null; description: string | null; created_by: string | null; created_at: string };
        Insert: { id?: string; user_id: string; amount: number; type?: "EARN" | "PENALTY" | "CORRECTION"; source_type: "QUIZ" | "ASSIGNMENT" | "ATTENDANCE" | "COMPETITION" | "PRACTICE" | "MANUAL"; description?: string | null };
        Update: Partial<Database["public"]["Tables"]["point_transactions"]["Insert"]>;
      };
      grade_components: {
        Row: { id: string; name: "QUIZ" | "ASSIGNMENT" | "PRACTICE" | "ATTENDANCE" | "COMPETITION"; description: string | null; created_at: string };
        Insert: { id?: string; name: "QUIZ" | "ASSIGNMENT" | "PRACTICE" | "ATTENDANCE" | "COMPETITION" };
        Update: Partial<Database["public"]["Tables"]["grade_components"]["Insert"]>;
      };
      grade_weights: {
        Row: { id: string; academic_period_id: string | null; course_id: string | null; division_id: string | null; component_id: string; weight: number; created_at: string };
        Insert: { id?: string; component_id: string; weight: number; academic_period_id?: string | null; course_id?: string | null; division_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["grade_weights"]["Insert"]>;
      };
      grade_scales: {
        Row: { id: string; academic_period_id: string | null; grade: "A" | "B" | "C" | "D" | "E"; min_score: number; max_score: number; created_at: string };
        Insert: { id?: string; grade: "A" | "B" | "C" | "D" | "E"; min_score: number; max_score: number; academic_period_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["grade_scales"]["Insert"]>;
      };
      grades: {
        Row: { id: string; user_id: string; academic_period_id: string | null; course_id: string | null; component_id: string; score: number; max_score: number; weight: number | null; final_score: number | null; grade: "A" | "B" | "C" | "D" | "E" | null; passed: boolean | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; component_id: string; score: number; academic_period_id?: string | null; course_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["grades"]["Insert"]>;
      };
      kkm_settings: {
        Row: { id: string; course_id: string | null; academic_period_id: string | null; kkm_score: number; created_at: string };
        Insert: { id?: string; kkm_score: number; course_id?: string | null; academic_period_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["kkm_settings"]["Insert"]>;
      };
      ranking_periods: {
        Row: { id: string; name: string; type: "MONTHLY" | "SEMESTER"; start_date: string; end_date: string; division_id: string | null; academic_period_id: string | null; status: "ACTIVE" | "CLOSED" | "ARCHIVED"; created_at: string };
        Insert: { id?: string; name: string; type: "MONTHLY" | "SEMESTER"; start_date: string; end_date: string; division_id?: string | null; academic_period_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["ranking_periods"]["Insert"]>;
      };
      ranking_entries: {
        Row: { id: string; ranking_period_id: string; user_id: string; rank: number; score: number; division_id: string | null; created_at: string };
        Insert: { id?: string; ranking_period_id: string; user_id: string; rank: number; score: number };
        Update: Partial<Database["public"]["Tables"]["ranking_entries"]["Insert"]>;
      };
      report_cards: {
        Row: { id: string; user_id: string; academic_period_id: string; division_id: string | null; final_score: number; grade: string; remarks: string | null; mentor_id: string | null; coordinator_id: string | null; generated_at: string };
        Insert: { id?: string; user_id: string; academic_period_id: string; final_score: number; grade: string };
        Update: Partial<Database["public"]["Tables"]["report_cards"]["Insert"]>;
      };
      report_card_items: {
        Row: { id: string; report_card_id: string; component_id: string; score: number; weight: number; weighted_score: number };
        Insert: { id?: string; report_card_id: string; component_id: string; score: number; weight: number; weighted_score: number };
        Update: Partial<Database["public"]["Tables"]["report_card_items"]["Insert"]>;
      };
      announcements: {
        Row: { id: string; title: string; content: string; division_id: string | null; class_id: string | null; is_pinned: boolean; is_published: boolean; created_by: string | null; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: { id?: string; title: string; content: string; division_id?: string | null; class_id?: string | null; is_pinned?: boolean; is_published?: boolean };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
      };
      forum_categories: {
        Row: { id: string; name: string; slug: string; description: string | null; division_id: string | null; created_at: string };
        Insert: { id?: string; name: string; slug: string; description?: string | null };
        Update: Partial<Database["public"]["Tables"]["forum_categories"]["Insert"]>;
      };
      forum_threads: {
        Row: { id: string; category_id: string; title: string; content: string; created_by: string; is_pinned: boolean; is_locked: boolean; view_count: number; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: { id?: string; category_id: string; title: string; content: string; created_by: string; is_pinned?: boolean; is_locked?: boolean };
        Update: Partial<Database["public"]["Tables"]["forum_threads"]["Insert"]>;
      };
      forum_posts: {
        Row: { id: string; thread_id: string; content: string; created_by: string; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: { id?: string; thread_id: string; content: string; created_by: string };
        Update: Partial<Database["public"]["Tables"]["forum_posts"]["Insert"]>;
      };
      material_comments: {
        Row: { id: string; material_id: string; content: string; parent_id: string | null; created_by: string; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: { id?: string; material_id: string; content: string; created_by: string; parent_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["material_comments"]["Insert"]>;
      };
      conversations: {
        Row: { id: string; is_group: boolean; title: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; is_group?: boolean; title?: string | null };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      conversation_members: {
        Row: { conversation_id: string; user_id: string; joined_at: string; last_read_at: string | null };
        Insert: { conversation_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["conversation_members"]["Insert"]>;
      };
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; deleted_at: string | null };
        Insert: { id: string; conversation_id: string; sender_id: string; content: string };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      notifications: {
        Row: { id: string; recipient_id: string; type: string; title: string; body: string | null; entity_type: string | null; entity_id: string | null; channel: "IN_APP" | "REALTIME" | "EMAIL"; read_at: string | null; created_at: string };
        Insert: { id?: string; recipient_id: string; type: string; title: string; body?: string | null; entity_type?: string | null; entity_id?: string | null; channel?: "IN_APP" | "REALTIME" | "EMAIL" };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      notification_preferences: {
        Row: { user_id: string; event_type: string; in_app: boolean; realtime: boolean; email: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; event_type: string; in_app?: boolean; realtime?: boolean; email?: boolean };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Insert"]>;
      };
      // Add other tables after migrations — see AGENTS.md §32
    };
    Views: Record<string, never>;
    Functions: {
      has_role: { Args: { uid: string; role: string }; Returns: boolean };
      has_permission: { Args: { uid: string; perm: string }; Returns: boolean };
      is_division_member: { Args: { uid: string; division_id: string }; Returns: boolean };
      is_class_member: { Args: { uid: string; class_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
