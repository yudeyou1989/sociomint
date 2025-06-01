/**
 * SocioMint Supabase 类型定义
 * 自动生成的数据库类型定义
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          wallet_address: string
          username: string | null
          email: string | null
          avatar_url: string | null
          bio: string | null
          twitter_username: string | null
          twitter_verified: boolean
          discord_username: string | null
          discord_verified: boolean
          telegram_username: string | null
          telegram_verified: boolean
          total_tasks_completed: number
          total_rewards_earned: number
          reputation_score: number
          is_verified: boolean
          is_merchant: boolean
          is_banned: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          wallet_address: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          twitter_username?: string | null
          twitter_verified?: boolean
          discord_username?: string | null
          discord_verified?: boolean
          telegram_username?: string | null
          telegram_verified?: boolean
          total_tasks_completed?: number
          total_rewards_earned?: number
          reputation_score?: number
          is_verified?: boolean
          is_merchant?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          twitter_username?: string | null
          twitter_verified?: boolean
          discord_username?: string | null
          discord_verified?: boolean
          telegram_username?: string | null
          telegram_verified?: boolean
          total_tasks_completed?: number
          total_rewards_earned?: number
          reputation_score?: number
          is_verified?: boolean
          is_merchant?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      user_balances: {
        Row: {
          id: string
          user_id: string
          sm_balance: number
          sm_staked: number
          red_flower_balance: number
          red_flower_earned_total: number
          bnb_balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sm_balance?: number
          sm_staked?: number
          red_flower_balance?: number
          red_flower_earned_total?: number
          bnb_balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sm_balance?: number
          sm_staked?: number
          red_flower_balance?: number
          red_flower_earned_total?: number
          bnb_balance?: number
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          tx_hash: string | null
          tx_type: string
          status: string
          amount_bnb: number | null
          amount_sm: number | null
          amount_red_flower: number | null
          from_address: string | null
          to_address: string | null
          gas_fee: number | null
          exchange_rate: number | null
          round_number: number | null
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tx_hash?: string | null
          tx_type: string
          status?: string
          amount_bnb?: number | null
          amount_sm?: number | null
          amount_red_flower?: number | null
          from_address?: string | null
          to_address?: string | null
          gas_fee?: number | null
          exchange_rate?: number | null
          round_number?: number | null
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tx_hash?: string | null
          tx_type?: string
          status?: string
          amount_bnb?: number | null
          amount_sm?: number | null
          amount_red_flower?: number | null
          from_address?: string | null
          to_address?: string | null
          gas_fee?: number | null
          exchange_rate?: number | null
          round_number?: number | null
          created_at?: string
          confirmed_at?: string | null
        }
      }
      social_tasks: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          task_type: string
          platform: string
          target_url: string | null
          required_action: string | null
          verification_method: string
          reward_amount: number
          reward_type: string
          max_participants: number | null
          current_participants: number
          status: string
          priority: number
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          task_type: string
          platform: string
          target_url?: string | null
          required_action?: string | null
          verification_method?: string
          reward_amount: number
          reward_type?: string
          max_participants?: number | null
          current_participants?: number
          status?: string
          priority?: number
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          task_type?: string
          platform?: string
          target_url?: string | null
          required_action?: string | null
          verification_method?: string
          reward_amount?: number
          reward_type?: string
          max_participants?: number | null
          current_participants?: number
          status?: string
          priority?: number
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_completions: {
        Row: {
          id: string
          task_id: string
          user_id: string
          status: string
          submission_data: Json | null
          verification_data: Json | null
          reward_amount: number | null
          reward_type: string | null
          reward_tx_hash: string | null
          submitted_at: string
          verified_at: string | null
          rewarded_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          status?: string
          submission_data?: Json | null
          verification_data?: Json | null
          reward_amount?: number | null
          reward_type?: string | null
          reward_tx_hash?: string | null
          submitted_at?: string
          verified_at?: string | null
          rewarded_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          status?: string
          submission_data?: Json | null
          verification_data?: Json | null
          reward_amount?: number | null
          reward_type?: string | null
          reward_tx_hash?: string | null
          submitted_at?: string
          verified_at?: string | null
          rewarded_at?: string | null
        }
      }
      treasure_boxes: {
        Row: {
          id: string
          user_id: string
          box_type: string
          source_type: string
          source_id: string | null
          status: string
          reward_content: Json | null
          total_value: number | null
          created_at: string
          opened_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          box_type: string
          source_type: string
          source_id?: string | null
          status?: string
          reward_content?: Json | null
          total_value?: number | null
          created_at?: string
          opened_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          box_type?: string
          source_type?: string
          source_id?: string | null
          status?: string
          reward_content?: Json | null
          total_value?: number | null
          created_at?: string
          opened_at?: string | null
        }
      }
      merchants: {
        Row: {
          id: string
          user_id: string
          merchant_name: string
          merchant_type: string
          business_license: string | null
          staked_amount: number
          stake_tx_hash: string | null
          total_trades: number
          successful_trades: number
          total_volume: number
          reputation_score: number
          status: string
          verification_level: string
          created_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          merchant_name: string
          merchant_type?: string
          business_license?: string | null
          staked_amount: number
          stake_tx_hash?: string | null
          total_trades?: number
          successful_trades?: number
          total_volume?: number
          reputation_score?: number
          status?: string
          verification_level?: string
          created_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          merchant_name?: string
          merchant_type?: string
          business_license?: string | null
          staked_amount?: number
          stake_tx_hash?: string | null
          total_trades?: number
          successful_trades?: number
          total_volume?: number
          reputation_score?: number
          status?: string
          verification_level?: string
          created_at?: string
          approved_at?: string | null
        }
      }
    }
    Views: {
      user_complete_info: {
        Row: {
          id: string
          wallet_address: string
          username: string | null
          email: string | null
          avatar_url: string | null
          bio: string | null
          twitter_username: string | null
          twitter_verified: boolean
          discord_username: string | null
          discord_verified: boolean
          telegram_username: string | null
          telegram_verified: boolean
          total_tasks_completed: number
          total_rewards_earned: number
          reputation_score: number
          is_verified: boolean
          is_merchant: boolean
          is_banned: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
          sm_balance: number | null
          sm_staked: number | null
          red_flower_balance: number | null
          red_flower_earned_total: number | null
          bnb_balance: number | null
          merchant_name: string | null
          verification_level: string | null
          merchant_reputation: number | null
          total_trades: number | null
          successful_trades: number | null
        }
      }
      active_tasks_view: {
        Row: {
          id: string
          title: string
          description: string
          task_type: string
          platform: string
          target_url: string | null
          required_action: string | null
          reward_amount: number
          reward_type: string
          max_participants: number | null
          current_participants: number
          priority: number
          start_time: string | null
          end_time: string | null
          created_at: string
          creator_username: string | null
          creator_avatar: string | null
          merchant_name: string | null
          verification_level: string | null
          completion_percentage: number | null
        }
      }
    }
    Functions: {
      calculate_staking_rewards: {
        Args: {
          staking_id: string
          current_time?: string
        }
        Returns: number
      }
      claim_staking_rewards: {
        Args: {
          user_wallet_address: string
          staking_id: string
        }
        Returns: Json
      }
      open_treasure_box: {
        Args: {
          user_wallet_address: string
          box_id: string
        }
        Returns: Json
      }
      get_user_stats: {
        Args: {
          user_wallet_address: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
