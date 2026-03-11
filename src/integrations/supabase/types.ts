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
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_prefix: string
          last_used_at: string | null
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_prefix?: string
          last_used_at?: string | null
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_prefix?: string
          last_used_at?: string | null
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          metadata: Json | null
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          metadata?: Json | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_duration: number | null
          call_outcome: string | null
          call_status: string
          caller_phone: string | null
          created_at: string
          ended_at: string | null
          id: string
          reservation_id: string | null
          sentiment: string | null
          started_at: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          call_duration?: number | null
          call_outcome?: string | null
          call_status?: string
          caller_phone?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          reservation_id?: string | null
          sentiment?: string | null
          started_at?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          call_duration?: number | null
          call_outcome?: string | null
          call_status?: string
          caller_phone?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          reservation_id?: string | null
          sentiment?: string | null
          started_at?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string
          stripe_product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          birth_day: number | null
          birth_month: number | null
          birthdate: string | null
          booking_count: number | null
          consent_status: string | null
          created_at: string
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          info: string | null
          language: string | null
          last_name: string | null
          name: string
          original_created_at: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_day?: number | null
          birth_month?: number | null
          birthdate?: string | null
          booking_count?: number | null
          consent_status?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          info?: string | null
          language?: string | null
          last_name?: string | null
          name: string
          original_created_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_day?: number | null
          birth_month?: number | null
          birthdate?: string | null
          booking_count?: number | null
          consent_status?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          info?: string | null
          language?: string | null
          last_name?: string | null
          name?: string
          original_created_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_api_keys: {
        Row: {
          api_key: string
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          api_key?: string
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_api_keys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_api_keys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers_sales_view"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string | null
          customer_user_id: string
          id: string
          salon_user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_user_id: string
          id?: string
          salon_user_id: string
        }
        Update: {
          created_at?: string | null
          customer_user_id?: string
          id?: string
          salon_user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          buffer_minutes: number
          cancellation_hours: number
          category: string | null
          city: string | null
          company_name: string | null
          cover_image_url: string | null
          created_at: string
          dashboard_pin: string | null
          description: string | null
          email: string
          facebook_url: string | null
          fiskaly_client_id: string | null
          fiskaly_tss_id: string | null
          id: string
          instagram_url: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          notes: string | null
          onboarding_step: number
          phone: string | null
          plan: string
          postal_code: string | null
          printer_ip: string | null
          published: boolean
          sales_rep_id: string | null
          slug: string | null
          status: string
          stripe_account_id: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          buffer_minutes?: number
          cancellation_hours?: number
          category?: string | null
          city?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          dashboard_pin?: string | null
          description?: string | null
          email: string
          facebook_url?: string | null
          fiskaly_client_id?: string | null
          fiskaly_tss_id?: string | null
          id: string
          instagram_url?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          notes?: string | null
          onboarding_step?: number
          phone?: string | null
          plan?: string
          postal_code?: string | null
          printer_ip?: string | null
          published?: boolean
          sales_rep_id?: string | null
          slug?: string | null
          status?: string
          stripe_account_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          buffer_minutes?: number
          cancellation_hours?: number
          category?: string | null
          city?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          dashboard_pin?: string | null
          description?: string | null
          email?: string
          facebook_url?: string | null
          fiskaly_client_id?: string | null
          fiskaly_tss_id?: string | null
          id?: string
          instagram_url?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          notes?: string | null
          onboarding_step?: number
          phone?: string | null
          plan?: string
          postal_code?: string | null
          printer_ip?: string | null
          published?: boolean
          sales_rep_id?: string | null
          slug?: string | null
          status?: string
          stripe_account_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      daily_closings: {
        Row: {
          cash_deposits: number
          cash_drawer_end: number
          cash_drawer_start: number
          cash_withdrawals: number
          closed_at: string | null
          closing_date: string
          created_at: string
          gross_revenue_products: number
          gross_revenue_services: number
          id: string
          net_revenue: number
          payment_card: number
          payment_cash: number
          payment_online: number
          payment_other: number
          status: string
          user_id: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          cash_deposits?: number
          cash_drawer_end?: number
          cash_drawer_start?: number
          cash_withdrawals?: number
          closed_at?: string | null
          closing_date: string
          created_at?: string
          gross_revenue_products?: number
          gross_revenue_services?: number
          id?: string
          net_revenue?: number
          payment_card?: number
          payment_cash?: number
          payment_online?: number
          payment_other?: number
          status?: string
          user_id: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          cash_deposits?: number
          cash_drawer_end?: number
          cash_drawer_start?: number
          cash_withdrawals?: number
          closed_at?: string | null
          closing_date?: string
          created_at?: string
          gross_revenue_products?: number
          gross_revenue_services?: number
          id?: string
          net_revenue?: number
          payment_card?: number
          payment_cash?: number
          payment_online?: number
          payment_other?: number
          status?: string
          user_id?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          answered_calls: number | null
          avg_call_duration: number | null
          conversion_rate: number | null
          created_at: string
          id: string
          missed_calls: number | null
          new_customers: number | null
          reservations_cancelled: number | null
          reservations_made: number | null
          stat_date: string
          total_calls: number | null
          user_id: string
        }
        Insert: {
          answered_calls?: number | null
          avg_call_duration?: number | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          missed_calls?: number | null
          new_customers?: number | null
          reservations_cancelled?: number | null
          reservations_made?: number | null
          stat_date: string
          total_calls?: number | null
          user_id: string
        }
        Update: {
          answered_calls?: number | null
          avg_call_duration?: number | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          missed_calls?: number | null
          new_customers?: number | null
          reservations_cancelled?: number | null
          reservations_made?: number | null
          stat_date?: string
          total_calls?: number | null
          user_id?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          applies_to: string
          category: string | null
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          name: string
          product_id: string | null
          user_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          applies_to?: string
          category?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          name: string
          product_id?: string | null
          user_id: string
          valid_from: string
          valid_until: string
        }
        Update: {
          applies_to?: string
          category?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string | null
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "discounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder: string | null
          id: string
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          price_type: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          price_type?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          price_type?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          end_time: string | null
          id: string
          notes: string | null
          party_size: number
          payment_method: string | null
          payment_status: string
          price_paid: number | null
          product_id: string | null
          reservation_date: string
          reservation_time: string
          source: string
          staff_member_id: string | null
          status: string
          tse_signature: string | null
          tse_timestamp: string | null
          tse_transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          payment_method?: string | null
          payment_status?: string
          price_paid?: number | null
          product_id?: string | null
          reservation_date: string
          reservation_time: string
          source?: string
          staff_member_id?: string | null
          status?: string
          tse_signature?: string | null
          tse_timestamp?: string | null
          tse_transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          payment_method?: string | null
          payment_status?: string
          price_paid?: number | null
          product_id?: string | null
          reservation_date?: string
          reservation_time?: string
          source?: string
          staff_member_id?: string | null
          status?: string
          tse_signature?: string | null
          tse_timestamp?: string | null
          tse_transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          salon_user_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          salon_user_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          salon_user_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      salon_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_name: string
          reviewer_user_id: string | null
          salon_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_name: string
          reviewer_user_id?: string | null
          salon_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_name?: string
          reviewer_user_id?: string | null
          salon_user_id?: string
        }
        Relationships: []
      }
      shift_exceptions: {
        Row: {
          created_at: string
          end_time: string
          exception_date: string
          id: string
          reason: string | null
          staff_member_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          exception_date: string
          id?: string
          reason?: string | null
          staff_member_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          exception_date?: string
          id?: string
          reason?: string | null
          staff_member_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_exceptions_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          avatar_url: string | null
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_working: boolean
          staff_member_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_working?: boolean
          staff_member_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_working?: boolean
          staff_member_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          customer_user_id: string | null
          end_time: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          product_id: string | null
          salon_user_id: string
          staff_member_id: string | null
          status: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_user_id?: string | null
          end_time?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          product_id?: string | null
          salon_user_id: string
          staff_member_id?: string | null
          status?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_user_id?: string | null
          end_time?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          product_id?: string | null
          salon_user_id?: string
          staff_member_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          responded_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          responded_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          responded_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          id: string
          notes: string | null
          payment_amount: number
          payment_method: string
          reservation_id: string | null
          staff_member_id: string | null
          status: string
          transaction_date: string
          transaction_number: string
          transaction_time: string
          transaction_type: string
          tse_signature: string | null
          tse_timestamp: string | null
          tse_transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_method?: string
          reservation_id?: string | null
          staff_member_id?: string | null
          status?: string
          transaction_date?: string
          transaction_number: string
          transaction_time?: string
          transaction_type?: string
          tse_signature?: string | null
          tse_timestamp?: string | null
          tse_transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_method?: string
          reservation_id?: string | null
          staff_member_id?: string | null
          status?: string
          transaction_date?: string
          transaction_number?: string
          transaction_time?: string
          transaction_type?: string
          tse_signature?: string | null
          tse_timestamp?: string | null
          tse_transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
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
      voice_agent_config: {
        Row: {
          business_name: string | null
          created_at: string
          default_responses: Json | null
          google_calendar_connected: boolean | null
          google_calendar_token: Json | null
          greeting_text: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          language: string | null
          opening_hours: Json | null
          phone_number: string | null
          reservation_settings: Json | null
          updated_at: string
          user_id: string
          voice: string | null
          website_url: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          default_responses?: Json | null
          google_calendar_connected?: boolean | null
          google_calendar_token?: Json | null
          greeting_text?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          language?: string | null
          opening_hours?: Json | null
          phone_number?: string | null
          reservation_settings?: Json | null
          updated_at?: string
          user_id: string
          voice?: string | null
          website_url?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          default_responses?: Json | null
          google_calendar_connected?: boolean | null
          google_calendar_token?: Json | null
          greeting_text?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          language?: string | null
          opening_hours?: Json | null
          phone_number?: string | null
          reservation_settings?: Json | null
          updated_at?: string
          user_id?: string
          voice?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      customers_sales_view: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string | null
          notes: string | null
          plan: string | null
          sales_rep_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          notes?: string | null
          plan?: string | null
          sales_rep_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          notes?: string | null
          plan?: string | null
          sales_rep_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_reservations_to_contacts: {
        Args: { p_user_id: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "customer" | "sales"
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
      app_role: ["admin", "manager", "customer", "sales"],
    },
  },
} as const
