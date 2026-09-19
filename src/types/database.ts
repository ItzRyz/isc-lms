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
