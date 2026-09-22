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
