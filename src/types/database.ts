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
