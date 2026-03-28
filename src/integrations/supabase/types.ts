Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          details: Json | null
          id: string
          ip_address: string | null
          module: string
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          module: string
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
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
          client_id: string | null
          commission_amount: number
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          professional_id: string | null
          profit_amount: number
          reminder_sent_at: string | null
          salon_id: string
          services: Json
          status: string
          total_buffer_minutes: number
          total_duration: number
          total_occupied_minutes: number
          total_price: number
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          booking_type?: string
          client_id?: string | null
          commission_amount?: number
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          profit_amount?: number
          reminder_sent_at?: string | null
          salon_id: string
          services?: Json
          status?: string
          total_buffer_minutes?: number
          total_duration?: number
          total_occupied_minutes?: number
          total_price?: number
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          booking_type?: string
          client_id?: string | null
          commission_amount?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          profit_amount?: number
          reminder_sent_at?: string | null
          salon_id?: string
          services?: Json
          status?: string
          total_buffer_minutes?: number
          total_duration?: number
          total_occupied_minutes?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      client_aliases: {
        Row: {
          alias_name: string
          client_id: string
          id: string
          last_used_at: string | null
          usage_count: number | null
        }
        Insert: {
          alias_name: string
          client_id: string
          id?: string
          last_used_at?: string | null
          usage_count?: number | null
        }
        Update: {
          alias_name?: string
          client_id?: string
          id?: string
          last_used_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_aliases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          last_seen_at: string | null
          merged_into_id: string | null
          phone_normalized: string
          preferred_name: string
          salon_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          merged_into_id?: string | null
          phone_normalized: string
          preferred_name: string
          salon_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          merged_into_id?: string | null
          phone_normalized?: string
          preferred_name?: string
          salon_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_salon_id_fkey"
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
      platform_users: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          active: boolean
          end_time: string
          id: string
          professional_id: string
          salon_id: string | null
          start_time: string
          weekday: number
        }
        Insert: {
          active?: boolean
          end_time: string
          id?: string
          professional_id: string
          salon_id?: string | null
          start_time: string
          weekday: number
        }
        Update: {
          active?: boolean
          end_time?: string
          id?: string
          professional_id?: string
          salon_id?: string | null
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_exceptions: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          professional_id: string
          reason: string | null
          start_time: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          professional_id: string
          reason?: string | null
          start_time?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          professional_id?: string
          reason?: string | null
          start_time?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_exceptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          active: boolean
          commission_override_type: string | null
          commission_override_value: number | null
          custom_buffer_minutes: number | null
          custom_duration_minutes: number | null
          custom_price: number | null
          id: string
          professional_id: string
          service_id: string
        }
        Insert: {
          active?: boolean
          commission_override_type?: string | null
          commission_override_value?: number | null
          custom_buffer_minutes?: number | null
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          professional_id: string
          service_id: string
        }
        Update: {
          active?: boolean
          commission_override_type?: string | null
          commission_override_value?: number | null
          custom_buffer_minutes?: number | null
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          commission_type: string
          commission_value: number
          created_at: string
          id: string
          name: string
          photo_url: string | null
          salon_id: string
        }
        Insert: {
          active?: boolean
          commission_type?: string
          commission_value?: number
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          salon_id: string
        }
        Update: {
          active?: boolean
          commission_type?: string
          commission_value?: number
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_label: string | null
          endpoint: string
          id: string
          p256dh: string
          salon_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_label?: string | null
          endpoint: string
          id?: string
          p256dh: string
          salon_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_label?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_salon_id_fkey"
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
          buffer_minutes: number
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
          buffer_minutes?: number
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
          buffer_minutes?: number
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
      subscription_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          features: Json | null
          id: string
          max_professionals: number
          max_services: number
          monthly_price: number
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          max_professionals?: number
          max_services?: number
          monthly_price?: number
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          max_professionals?: number
          max_services?: number
          monthly_price?: number
          name?: string
        }
        Relationships: []
      }
      tenant_branding: {
        Row: {
          about_text: string | null
          about_title: string | null
          accent_color: string | null
          background_color: string | null
          created_at: string
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          footer_text: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tenant_id: string
          text_color: string | null
          updated_at: string
        }
        Insert: {
          about_text?: string | null
          about_title?: string | null
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id: string
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          about_text?: string | null
          about_title?: string | null
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string
          text_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_details: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          legal_name: string | null
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          whatsapp_phone: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          phone?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
          whatsapp_phone?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_phone?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          allow_walk_in: boolean
          booking_enabled: boolean
          commission_enabled: boolean
          created_at: string
          financial_enabled: boolean
          gallery_enabled: boolean
          id: string
          multi_unit_enabled: boolean
          pwa_enabled: boolean
          reports_enabled: boolean
          tenant_id: string
          testimonials_enabled: boolean
          timezone: string | null
          updated_at: string
          video_enabled: boolean
          whatsapp_notifications_enabled: boolean
        }
        Insert: {
          allow_walk_in?: boolean
          booking_enabled?: boolean
          commission_enabled?: boolean
          created_at?: string
          financial_enabled?: boolean
          gallery_enabled?: boolean
          id?: string
          multi_unit_enabled?: boolean
          pwa_enabled?: boolean
          reports_enabled?: boolean
          tenant_id: string
          testimonials_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          video_enabled?: boolean
          whatsapp_notifications_enabled?: boolean
        }
        Update: {
          allow_walk_in?: boolean
          booking_enabled?: boolean
          commission_enabled?: boolean
          created_at?: string
          financial_enabled?: boolean
          gallery_enabled?: boolean
          id?: string
          multi_unit_enabled?: boolean
          pwa_enabled?: boolean
          reports_enabled?: boolean
          tenant_id?: string
          testimonials_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          video_enabled?: boolean
          whatsapp_notifications_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          amount: number
          created_at: string
          end_date: string | null
          id: string
          plan_id: string
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id: string
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active_services: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          active_services?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          active_services?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
      check_booking_conflict: {
        Args: {
          p_booking_date: string
          p_booking_time: string
          p_exclude_id?: string
          p_professional_id: string
          p_total_occupied_minutes: number
        }
        Returns: boolean
      }
      upsert_client_by_phone: {
        Args: { p_name: string; p_phone: string; p_salon_id: string }
        Returns: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
