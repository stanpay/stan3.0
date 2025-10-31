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
      gifticons: {
        Row: {
          brand: string
          created_at: string | null
          expiry_date: string
          id: string
          image: string
          is_selling: boolean | null
          name: string
          original_price: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string | null
          expiry_date: string
          id?: string
          image: string
          is_selling?: boolean | null
          name: string
          original_price: number
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          image?: string
          is_selling?: boolean | null
          name?: string
          original_price?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          method: string
          status: string
          store: string
          time: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          method: string
          status: string
          store: string
          time: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          method?: string
          status?: string
          store?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          gifticons_count: number
          id: string
          name: string | null
          payment_count: number
          points: number
          selling_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          gifticons_count?: number
          id: string
          name?: string | null
          payment_count?: number
          points?: number
          selling_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          gifticons_count?: number
          id?: string
          name?: string | null
          payment_count?: number
          points?: number
          selling_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          page_name: string
          page_path: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page_name: string
          page_path: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page_name?: string
          page_path?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          cjone: boolean | null
          compose_coffee: boolean | null
          created_at: string | null
          ediya: boolean | null
          happy_point: boolean | null
          hpoint: boolean | null
          id: string
          kakaopay: boolean | null
          kbpay: boolean | null
          kt: boolean | null
          lg_uplus: boolean | null
          lpoint: boolean | null
          mega_coffee: boolean | null
          naverpay: boolean | null
          paik: boolean | null
          payco: boolean | null
          samsungpay: boolean | null
          shinhan: boolean | null
          skt: boolean | null
          starbucks: boolean | null
          tosspay: boolean | null
          twosome: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cjone?: boolean | null
          compose_coffee?: boolean | null
          created_at?: string | null
          ediya?: boolean | null
          happy_point?: boolean | null
          hpoint?: boolean | null
          id?: string
          kakaopay?: boolean | null
          kbpay?: boolean | null
          kt?: boolean | null
          lg_uplus?: boolean | null
          lpoint?: boolean | null
          mega_coffee?: boolean | null
          naverpay?: boolean | null
          paik?: boolean | null
          payco?: boolean | null
          samsungpay?: boolean | null
          shinhan?: boolean | null
          skt?: boolean | null
          starbucks?: boolean | null
          tosspay?: boolean | null
          twosome?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cjone?: boolean | null
          compose_coffee?: boolean | null
          created_at?: string | null
          ediya?: boolean | null
          happy_point?: boolean | null
          hpoint?: boolean | null
          id?: string
          kakaopay?: boolean | null
          kbpay?: boolean | null
          kt?: boolean | null
          lg_uplus?: boolean | null
          lpoint?: boolean | null
          mega_coffee?: boolean | null
          naverpay?: boolean | null
          paik?: boolean | null
          payco?: boolean | null
          samsungpay?: boolean | null
          shinhan?: boolean | null
          skt?: boolean | null
          starbucks?: boolean | null
          tosspay?: boolean | null
          twosome?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          email: string
          code: string
          expires_at: string
          created_at?: string | null
        }
        Insert: {
          email: string
          code: string
          expires_at: string
          created_at?: string | null
        }
        Update: {
          email?: string
          code?: string
          expires_at?: string
          created_at?: string | null
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
