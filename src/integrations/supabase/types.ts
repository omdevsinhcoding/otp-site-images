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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_services: {
        Row: {
          base_price: number
          cancel_disable_time: number
          created_at: string
          created_by: string
          final_price: number | null
          id: string
          is_active: boolean
          is_popular: boolean
          logo_url: string | null
          margin_percentage: number
          operator: string
          server_id: string
          service_code: string
          service_name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          cancel_disable_time?: number
          created_at?: string
          created_by: string
          final_price?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          logo_url?: string | null
          margin_percentage?: number
          operator: string
          server_id: string
          service_code: string
          service_name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          cancel_disable_time?: number
          created_at?: string
          created_by?: string
          final_price?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          logo_url?: string | null
          margin_percentage?: number
          operator?: string
          server_id?: string
          service_code?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_services_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "auto_sms_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_sms_servers: {
        Row: {
          api_activate_next_message_url: string | null
          api_cancel_number_url: string | null
          api_get_message_url: string | null
          api_get_number_url: string
          api_key: string
          api_response_type: string
          api_retry_count: number
          auto_cancel_minutes: number
          country_code: string
          country_dial_code: string
          country_flag: string | null
          country_name: string
          created_at: string
          created_by: string
          header_key_name: string | null
          header_value: string | null
          id: string
          is_active: boolean
          number_id_path: string | null
          otp_path_in_json: string | null
          phone_number_path: string | null
          provider: string
          server_name: string
          updated_at: string
          uses_headers: boolean
        }
        Insert: {
          api_activate_next_message_url?: string | null
          api_cancel_number_url?: string | null
          api_get_message_url?: string | null
          api_get_number_url: string
          api_key: string
          api_response_type?: string
          api_retry_count?: number
          auto_cancel_minutes?: number
          country_code: string
          country_dial_code: string
          country_flag?: string | null
          country_name: string
          created_at?: string
          created_by: string
          header_key_name?: string | null
          header_value?: string | null
          id?: string
          is_active?: boolean
          number_id_path?: string | null
          otp_path_in_json?: string | null
          phone_number_path?: string | null
          provider?: string
          server_name: string
          updated_at?: string
          uses_headers?: boolean
        }
        Update: {
          api_activate_next_message_url?: string | null
          api_cancel_number_url?: string | null
          api_get_message_url?: string | null
          api_get_number_url?: string
          api_key?: string
          api_response_type?: string
          api_retry_count?: number
          auto_cancel_minutes?: number
          country_code?: string
          country_dial_code?: string
          country_flag?: string | null
          country_name?: string
          created_at?: string
          created_by?: string
          header_key_name?: string | null
          header_value?: string | null
          id?: string
          is_active?: boolean
          number_id_path?: string | null
          otp_path_in_json?: string | null
          phone_number_path?: string | null
          provider?: string
          server_name?: string
          updated_at?: string
          uses_headers?: boolean
        }
        Relationships: []
      }
      number_activations: {
        Row: {
          activation_id: string
          cancelled_at: string | null
          created_at: string
          has_otp_received: boolean
          id: string
          messages: Json | null
          phone_number: string
          price: number
          refunded: boolean
          server_id: string
          service_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_id: string
          cancelled_at?: string | null
          created_at?: string
          has_otp_received?: boolean
          id?: string
          messages?: Json | null
          phone_number: string
          price: number
          refunded?: boolean
          server_id: string
          service_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_id?: string
          cancelled_at?: string | null
          created_at?: string
          has_otp_received?: boolean
          id?: string
          messages?: Json | null
          phone_number?: string
          price?: number
          refunded?: boolean
          server_id?: string
          service_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "number_activations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      paytm_orders: {
        Row: {
          amount: number
          bank_txn_id: string | null
          completed_at: string | null
          created_at: string
          expires_at: string
          gateway_name: string | null
          id: string
          order_id: string
          payment_mode: string | null
          paytm_txn_id: string | null
          resp_code: string | null
          resp_msg: string | null
          status: string
          txn_token: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_txn_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          gateway_name?: string | null
          id?: string
          order_id: string
          payment_mode?: string | null
          paytm_txn_id?: string | null
          resp_code?: string | null
          resp_msg?: string | null
          status?: string
          txn_token?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_txn_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          gateway_name?: string | null
          id?: string
          order_id?: string
          payment_mode?: string | null
          paytm_txn_id?: string | null
          resp_code?: string | null
          resp_msg?: string | null
          status?: string
          txn_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paytm_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_cancellations: {
        Row: {
          activation_id: string
          attempts: number
          cancel_after: string
          cancelled_at: string | null
          created_at: string
          error_message: string | null
          id: string
          phone_number: string
          server_id: string
          service_id: string | null
          status: string
        }
        Insert: {
          activation_id: string
          attempts?: number
          cancel_after?: string
          cancelled_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          phone_number: string
          server_id: string
          service_id?: string | null
          status?: string
        }
        Update: {
          activation_id?: string
          attempts?: number
          cancel_after?: string
          cancelled_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          phone_number?: string
          server_id?: string
          service_id?: string | null
          status?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          created_by: string | null
          current_redemptions: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number
        }
        Insert: {
          amount?: number
          code: string
          created_at?: string
          created_by?: string | null
          current_redemptions?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          current_redemptions?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          amount: number
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          available_balance: number
          id: string
          total_earned: number
          updated_at: string
          user_id: string
          withdrawn: number
        }
        Insert: {
          available_balance?: number
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
          withdrawn?: number
        }
        Update: {
          available_balance?: number
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
          withdrawn?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          deposit_amount: number
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          deposit_amount?: number
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          deposit_amount?: number
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          cancel_disable_time: number
          created_at: string
          created_by: string
          final_price: number | null
          id: string
          is_active: boolean
          is_popular: boolean
          logo_url: string | null
          margin_percentage: number
          server_id: string
          service_code: string
          service_name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          cancel_disable_time?: number
          created_at?: string
          created_by: string
          final_price?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          logo_url?: string | null
          margin_percentage?: number
          server_id: string
          service_code: string
          service_name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          cancel_disable_time?: number
          created_at?: string
          created_by?: string
          final_price?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          logo_url?: string | null
          margin_percentage?: number
          server_id?: string
          service_code?: string
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "sms_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_servers: {
        Row: {
          api_activate_next_message_url: string | null
          api_cancel_number_url: string | null
          api_get_message_url: string | null
          api_get_number_url: string
          api_response_type: string
          api_retry_count: number
          auto_cancel_minutes: number
          country_code: string
          country_dial_code: string
          country_flag: string | null
          country_name: string
          created_at: string
          created_by: string
          header_key_name: string | null
          header_value: string | null
          id: string
          is_active: boolean
          number_id_path: string | null
          otp_path_in_json: string | null
          phone_number_path: string | null
          server_name: string
          updated_at: string
          uses_headers: boolean
        }
        Insert: {
          api_activate_next_message_url?: string | null
          api_cancel_number_url?: string | null
          api_get_message_url?: string | null
          api_get_number_url: string
          api_response_type?: string
          api_retry_count?: number
          auto_cancel_minutes?: number
          country_code: string
          country_dial_code: string
          country_flag?: string | null
          country_name: string
          created_at?: string
          created_by: string
          header_key_name?: string | null
          header_value?: string | null
          id?: string
          is_active?: boolean
          number_id_path?: string | null
          otp_path_in_json?: string | null
          phone_number_path?: string | null
          server_name: string
          updated_at?: string
          uses_headers?: boolean
        }
        Update: {
          api_activate_next_message_url?: string | null
          api_cancel_number_url?: string | null
          api_get_message_url?: string | null
          api_get_number_url?: string
          api_response_type?: string
          api_retry_count?: number
          auto_cancel_minutes?: number
          country_code?: string
          country_dial_code?: string
          country_flag?: string | null
          country_name?: string
          created_at?: string
          created_by?: string
          header_key_name?: string | null
          header_value?: string | null
          id?: string
          is_active?: boolean
          number_id_path?: string | null
          otp_path_in_json?: string | null
          phone_number_path?: string | null
          server_name?: string
          updated_at?: string
          uses_headers?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      upi_recharges: {
        Row: {
          amount: number
          created_at: string
          id: string
          payer_handle: string | null
          payer_name: string | null
          status: string
          txn_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payer_handle?: string | null
          payer_name?: string | null
          status?: string
          txn_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payer_handle?: string | null
          payer_name?: string | null
          status?: string
          txn_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upi_recharges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      upi_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          merchant_id: string
          merchant_token: string
          min_recharge: number
          updated_at: string
          upi_id: string
          upi_qr_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          merchant_id?: string
          merchant_token?: string
          min_recharge?: number
          updated_at?: string
          upi_id?: string
          upi_qr_url?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          merchant_id?: string
          merchant_token?: string
          min_recharge?: number
          updated_at?: string
          upi_id?: string
          upi_qr_url?: string
        }
        Relationships: []
      }
      user_favorite_services: {
        Row: {
          created_at: string | null
          id: string
          service_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          uid: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          uid?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          uid?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          discount_type: string | null
          discount_value: number | null
          id: string
          total_otp: number
          total_recharge: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          total_otp?: number
          total_recharge?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          total_otp?: number
          total_recharge?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_banned: boolean
          last_active: string | null
          name: string | null
          password_hash: string
          uid: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_banned?: boolean
          last_active?: string | null
          name?: string | null
          password_hash: string
          uid?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_banned?: boolean
          last_active?: string | null
          name?: string | null
          password_hash?: string
          uid?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_recharge: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      admin_add_service: {
        Args: {
          p_admin_id: string
          p_base_price?: number
          p_cancel_disable_time?: number
          p_is_popular?: boolean
          p_logo_url?: string
          p_margin_percentage?: number
          p_server_id: string
          p_service_code: string
          p_service_name: string
        }
        Returns: Json
      }
      admin_add_sms_server:
        | {
            Args: {
              p_admin_id: string
              p_api_activate_next_message_url: string
              p_api_cancel_number_url: string
              p_api_get_message_url: string
              p_api_get_number_url: string
              p_api_response_type: string
              p_api_retry_count: number
              p_auto_cancel_minutes: number
              p_country_code: string
              p_country_dial_code: string
              p_country_flag: string
              p_country_name: string
              p_header_key_name: string
              p_header_value: string
              p_number_id_path: string
              p_otp_path_in_json: string
              p_phone_number_path: string
              p_server_name: string
              p_uses_headers: boolean
            }
            Returns: Json
          }
        | {
            Args: {
              p_admin_id: string
              p_api_activate_next_message_url: string
              p_api_get_message_url: string
              p_api_get_number_url: string
              p_api_response_type: string
              p_api_retry_count: number
              p_auto_cancel_minutes: number
              p_country_code: string
              p_country_dial_code: string
              p_country_flag: string
              p_country_name: string
              p_header_key_name: string
              p_header_value: string
              p_number_id_path: string
              p_otp_path_in_json: string
              p_phone_number_path: string
              p_server_name: string
              p_uses_headers: boolean
            }
            Returns: Json
          }
      admin_ban_user: {
        Args: { p_admin_id: string; p_ban: boolean; p_user_id: string }
        Returns: Json
      }
      admin_create_promo_code: {
        Args: {
          p_admin_id: string
          p_amount: number
          p_code: string
          p_expires_at?: string
          p_max_redemptions: number
        }
        Returns: Json
      }
      admin_delete_promo_code: {
        Args: { p_admin_id: string; p_promo_id: string }
        Returns: Json
      }
      admin_delete_server: {
        Args: {
          p_admin_id: string
          p_server_id: string
          p_source_table: string
        }
        Returns: Json
      }
      admin_get_all_users: { Args: { p_admin_id: string }; Returns: Json }
      admin_get_promo_codes: { Args: { p_admin_id: string }; Returns: Json }
      admin_get_server_details: {
        Args: {
          p_admin_id: string
          p_server_id: string
          p_source_table: string
        }
        Returns: Json
      }
      admin_get_upi_settings: { Args: { p_admin_id: string }; Returns: Json }
      admin_list_servers: { Args: { p_admin_id: string }; Returns: Json }
      admin_remove_user_role: {
        Args: { p_owner_id: string; p_target_user_id: string }
        Returns: Json
      }
      admin_reset_user_password: {
        Args: { p_admin_id: string; p_new_password: string; p_user_id: string }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["app_role"]
          p_owner_id: string
          p_target_user_id: string
        }
        Returns: Json
      }
      admin_toggle_promo_code: {
        Args: { p_admin_id: string; p_promo_id: string }
        Returns: Json
      }
      admin_update_server: {
        Args: {
          p_admin_id: string
          p_server_data: Json
          p_server_id: string
          p_source_table: string
        }
        Returns: Json
      }
      admin_update_upi_settings: {
        Args: {
          p_admin_id: string
          p_is_active?: boolean
          p_merchant_id: string
          p_merchant_token: string
          p_min_recharge: number
          p_upi_id: string
          p_upi_qr_url: string
        }
        Returns: Json
      }
      admin_update_user_balance:
        | {
            Args: {
              p_admin_id: string
              p_amount: number
              p_operation: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_admin_id: string
              p_amount: number
              p_notes?: string
              p_operation: string
              p_user_id: string
            }
            Returns: Json
          }
      admin_update_user_discount: {
        Args: {
          p_admin_id: string
          p_discount_type: string
          p_discount_value: number
          p_user_id: string
        }
        Returns: Json
      }
      admin_update_user_stats: {
        Args: {
          p_admin_id: string
          p_balance?: number
          p_total_otp?: number
          p_total_recharge?: number
          p_user_id: string
        }
        Returns: Json
      }
      batch_insert_auto_services: {
        Args: { p_services: Json; p_user_id: string }
        Returns: Json
      }
      batch_insert_auto_sms_servers: {
        Args: { p_servers: Json; p_user_id: string }
        Returns: Json
      }
      cancel_number_activation: {
        Args: { p_activation_id: string; p_user_id: string }
        Returns: Json
      }
      create_number_activation: {
        Args: {
          p_activation_id: string
          p_phone_number: string
          p_price: number
          p_server_id: string
          p_service_id: string
          p_user_id: string
        }
        Returns: Json
      }
      create_paytm_order: {
        Args: {
          p_amount: number
          p_expires_minutes?: number
          p_order_id: string
          p_user_id: string
        }
        Returns: Json
      }
      deduct_for_number_purchase: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      generate_professional_uid: { Args: never; Returns: string }
      get_admin_count: { Args: never; Returns: number }
      get_admin_counts_by_role: { Args: never; Returns: Json }
      get_admin_level: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      get_admin_role: { Args: { p_user_id: string }; Returns: Json }
      get_admin_stats: { Args: { p_admin_id: string }; Returns: Json }
      get_all_admins: { Args: { p_requester_id: string }; Returns: Json }
      get_all_sms_servers: { Args: never; Returns: Json }
      get_app_setting: { Args: { p_setting_key: string }; Returns: Json }
      get_or_create_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_pending_paytm_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      get_public_servers: { Args: never; Returns: Json }
      get_public_services: { Args: never; Returns: Json }
      get_referral_count: { Args: never; Returns: number }
      get_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_server_details: { Args: { p_server_ids: string[] }; Returns: Json }
      get_service_details: { Args: { p_service_ids: string[] }; Returns: Json }
      get_smsbower_server_ids: { Args: never; Returns: Json }
      get_upi_settings_public: { Args: never; Returns: Json }
      get_user_active_numbers: { Args: { p_user_id: string }; Returns: Json }
      get_user_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_number_history: { Args: { p_user_id: string }; Returns: Json }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_transactions: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_wallet_balance: { Args: { p_user_id: string }; Returns: number }
      has_admin_level: {
        Args: { p_min_level: number; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      insert_auto_sms_server: {
        Args: {
          p_api_activate_next_message_url: string
          p_api_cancel_number_url: string
          p_api_get_message_url: string
          p_api_get_number_url: string
          p_api_key: string
          p_api_response_type: string
          p_api_retry_count: number
          p_auto_cancel_minutes: number
          p_country_code: string
          p_country_dial_code: string
          p_country_flag: string
          p_country_name: string
          p_header_key_name: string
          p_header_value: string
          p_is_active: boolean
          p_number_id_path: string
          p_otp_path_in_json: string
          p_phone_number_path: string
          p_provider: string
          p_server_name: string
          p_user_id: string
          p_uses_headers: boolean
        }
        Returns: Json
      }
      login_user: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      process_upi_recharge: {
        Args: {
          p_amount: number
          p_payer_handle?: string
          p_payer_name?: string
          p_txn_id: string
          p_user_id: string
        }
        Returns: Json
      }
      redeem_promo_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      register_user: {
        Args: { p_email: string; p_name?: string; p_password: string }
        Returns: Json
      }
      update_activation_message: {
        Args: { p_activation_id: string; p_message: string }
        Returns: Json
      }
      update_app_setting: {
        Args: {
          p_setting_key: string
          p_setting_value: Json
          p_user_id: string
        }
        Returns: Json
      }
      update_paytm_order: {
        Args: {
          p_bank_txn_id?: string
          p_gateway_name?: string
          p_order_id: string
          p_payment_mode?: string
          p_paytm_txn_id?: string
          p_resp_code?: string
          p_resp_msg?: string
          p_status: string
        }
        Returns: Json
      }
      update_user_avatar: {
        Args: { p_avatar_url: string; p_user_id: string }
        Returns: Json
      }
      update_user_last_active: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      verify_password: {
        Args: { password: string; password_hash: string }
        Returns: boolean
      }
      withdraw_referral_earnings: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner" | "manager" | "handler"
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
      app_role: ["admin", "moderator", "user", "owner", "manager", "handler"],
    },
  },
} as const
