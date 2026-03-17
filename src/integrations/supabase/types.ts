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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      availability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_closed: boolean
          salon_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string
          id?: string
          is_closed?: boolean
          salon_id: string
          start_time?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_closed?: boolean
          salon_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          booking_type: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          salon_id: string
          services: Json
          status: string
          total_duration: number
          total_price: number
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          booking_type?: string
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          salon_id: string
          services?: Json
          status?: string
          total_duration?: number
          total_price?: number
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          booking_type?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          salon_id?: string
          services?: Json
          status?: string
          total_duration?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          salon_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          salon_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          salon_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          about_text: string | null
          active: boolean
          address: string | null
          created_at: string
          facebook: string | null
          hero_image_url: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          opening_hours: Json | null
          phone: string | null
          primary_color: string | null
          slug: string | null
          updated_at: string
          video_url: string | null
          whatsapp: string | null
        }
        Insert: {
          about_text?: string | null
          active?: boolean
          address?: string | null
          created_at?: string
          facebook?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          primary_color?: string | null
          slug?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          about_text?: string | null
          active?: boolean
          address?: string | null
          created_at?: string
          facebook?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          primary_color?: string | null
          slug?: string | null
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          image_url: string | null
          is_combo: boolean
          name: string
          price: number
          salon_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_combo?: boolean
          name: string
          price?: number
          salon_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_combo?: boolean
          name?: string
          price?: number
          salon_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          active: boolean
          author_image: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          rating: number | null
          salon_id: string
        }
        Insert: {
          active?: boolean
          author_image?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          rating?: number | null
          salon_id: string
        }
        Update: {
          active?: boolean
          author_image?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          rating?: number | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
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
