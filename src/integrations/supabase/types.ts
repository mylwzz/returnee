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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      custody_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["custody_event_type"]
          id: string
          image_url: string | null
          metadata: Json | null
          pickup_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["custody_event_type"]
          id?: string
          image_url?: string | null
          metadata?: Json | null
          pickup_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["custody_event_type"]
          id?: string
          image_url?: string | null
          metadata?: Json | null
          pickup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custody_events_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: false
            referencedRelation: "pickups"
            referencedColumns: ["id"]
          },
        ]
      }
      pickups: {
        Row: {
          created_at: string
          customer_id: string
          driver_id: string | null
          drop_carrier: Database["public"]["Enums"]["drop_carrier"]
          drop_location_label: string | null
          estimated_fee_cents: number
          final_fee_cents: number | null
          id: string
          needs_box: boolean
          needs_label_print: boolean
          notes_for_driver: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          return_artifact_text: string | null
          return_artifact_type: Database["public"]["Enums"]["return_artifact_type"]
          return_artifact_url: string | null
          return_deadline: string
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          driver_id?: string | null
          drop_carrier: Database["public"]["Enums"]["drop_carrier"]
          drop_location_label?: string | null
          estimated_fee_cents?: number
          final_fee_cents?: number | null
          id?: string
          needs_box?: boolean
          needs_label_print?: boolean
          notes_for_driver?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          return_artifact_text?: string | null
          return_artifact_type: Database["public"]["Enums"]["return_artifact_type"]
          return_artifact_url?: string | null
          return_deadline: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          window_end: string
          window_start: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          driver_id?: string | null
          drop_carrier?: Database["public"]["Enums"]["drop_carrier"]
          drop_location_label?: string | null
          estimated_fee_cents?: number
          final_fee_cents?: number | null
          id?: string
          needs_box?: boolean
          needs_label_print?: boolean
          notes_for_driver?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          return_artifact_text?: string | null
          return_artifact_type?: Database["public"]["Enums"]["return_artifact_type"]
          return_artifact_url?: string | null
          return_deadline?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "driver" | "admin"
      custody_event_type:
        | "pickup_photo"
        | "pickup_scan"
        | "drop_photo"
        | "drop_receipt"
      drop_carrier: "ups" | "fedex" | "usps" | "best_option"
      pickup_status:
        | "requested"
        | "scheduled"
        | "driver_assigned"
        | "picked_up"
        | "dropped_at_carrier"
        | "completed"
        | "canceled"
      return_artifact_type: "file" | "qr_code"
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
      app_role: ["customer", "driver", "admin"],
      custody_event_type: [
        "pickup_photo",
        "pickup_scan",
        "drop_photo",
        "drop_receipt",
      ],
      drop_carrier: ["ups", "fedex", "usps", "best_option"],
      pickup_status: [
        "requested",
        "scheduled",
        "driver_assigned",
        "picked_up",
        "dropped_at_carrier",
        "completed",
        "canceled",
      ],
      return_artifact_type: ["file", "qr_code"],
    },
  },
} as const
