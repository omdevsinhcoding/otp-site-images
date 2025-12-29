// Database abstraction types - all database implementations must conform to these interfaces

export interface User {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  password_hash: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  last_active?: string | null;
}

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  total_recharge: number;
  total_otp: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  admin_id?: string | null;
  type: string;
  amount: number;
  description?: string | null;
  created_at: string;
  admin_uid?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  email?: string | null;
  uid?: string | null;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface ReferralEarnings {
  id: string;
  user_id: string;
  total_earned: number;
  available_balance: number;
  withdrawn: number;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  deposit_amount: number;
  commission_amount: number;
  commission_rate: number;
  created_at: string;
}

// Result types for operations
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  balance: number;
  total_recharge: number;
  total_otp: number;
}

export interface ReferralStats {
  referred_count: number;
  total_earned: number;
  available_balance: number;
}

export interface AdminUserData {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  created_at: string;
  last_active: string | null;
  balance: number;
  total_recharge: number;
  total_otp: number;
  role: 'admin' | 'moderator' | 'user';
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

export interface TransactionsResult {
  transactions: Transaction[];
  total: number;
}

export interface LoginResult {
  user: {
    id: string;
    uid: string;
    email: string;
    name: string | null;
    created_at: string;
    is_banned?: boolean;
  };
}

export interface BalanceUpdateResult {
  previous_balance: number;
  new_balance: number;
  operation: string;
  amount: number;
}
