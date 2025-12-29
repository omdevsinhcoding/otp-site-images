// Database interface definitions - implement these for any database provider

import type {
  User,
  UserWallet,
  Transaction,
  UserRole,
  ReferralCode,
  ReferralEarnings,
  Referral,
  OperationResult,
  DashboardStats,
  ReferralStats,
  AdminUserData,
  TransactionsResult,
  LoginResult,
  BalanceUpdateResult,
} from './types';

// Auth Repository Interface
export interface IAuthRepository {
  registerUser(email: string, password: string, name?: string): Promise<OperationResult<LoginResult>>;
  loginUser(email: string, password: string): Promise<OperationResult<LoginResult>>;
  getUserById(userId: string): Promise<User | null>;
  updateUserAvatar(userId: string, avatarUrl: string): Promise<OperationResult>;
  updateUserLastActive(userId: string): Promise<void>;
}

// User Repository Interface
export interface IUserRepository {
  getUserRole(userId: string): Promise<'admin' | 'moderator' | 'user'>;
  hasRole(userId: string, role: 'admin' | 'moderator' | 'user'): Promise<boolean>;
  getDashboardStats(userId: string): Promise<OperationResult<DashboardStats>>;
  getWalletBalance(userId: string): Promise<number>;
}

// Transaction Repository Interface
export interface ITransactionRepository {
  getUserTransactions(
    userId: string,
    limit?: number,
    offset?: number,
    type?: string
  ): Promise<OperationResult<TransactionsResult>>;
  addRecharge(userId: string, amount: number): Promise<OperationResult<{ new_balance: number; total_recharge: number }>>;
  deductForPurchase(userId: string, amount: number, description?: string): Promise<OperationResult<{ new_balance: number }>>;
}

// Referral Repository Interface
export interface IReferralRepository {
  getOrCreateReferralCode(userId: string): Promise<string>;
  getReferralStats(userId: string): Promise<OperationResult<ReferralStats>>;
  withdrawEarnings(userId: string): Promise<OperationResult<{ amount_withdrawn: number; new_wallet_balance: number }>>;
}

// SMS Server Data Interface
export interface SmsServerData {
  id?: string;
  server_name: string;
  country_code: string;
  country_name: string;
  country_dial_code: string;
  country_flag?: string;
  api_response_type: 'text' | 'json';
  uses_headers: boolean;
  header_key_name?: string;
  header_value?: string;
  api_get_number_url: string;
  api_get_message_url?: string;
  api_activate_next_message_url?: string;
  api_cancel_number_url?: string;
  number_id_path?: string;
  phone_number_path?: string;
  otp_path_in_json?: string;
  auto_cancel_minutes: number;
  api_retry_count: number;
}

// Admin Repository Interface
export interface IAdminRepository {
  getAllUsers(adminId: string): Promise<OperationResult<AdminUserData[]>>;
  updateUserBalance(
    adminId: string,
    userId: string,
    amount: number,
    operation: 'credit' | 'debit',
    notes?: string
  ): Promise<OperationResult<BalanceUpdateResult>>;
  updateUserStats(
    adminId: string,
    userId: string,
    balance?: number,
    totalRecharge?: number,
    totalOtp?: number
  ): Promise<OperationResult>;
  resetUserPassword(adminId: string, userId: string, newPassword: string): Promise<OperationResult>;
  updateUserDiscount(
    adminId: string,
    userId: string,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ): Promise<OperationResult<{ discount_type: string; discount_value: number }>>;
  addSmsServer(
    adminId: string,
    serverData: SmsServerData
  ): Promise<OperationResult<{ id: string; server_name: string; country_name: string }>>;
}

// Storage Repository Interface
export interface IStorageRepository {
  uploadFile(bucket: string, path: string, file: File): Promise<OperationResult<{ url: string }>>;
  deleteFile(bucket: string, path: string): Promise<OperationResult>;
  getPublicUrl(bucket: string, path: string): string;
}

// Combined Database Service Interface
export interface IDatabaseService {
  auth: IAuthRepository;
  users: IUserRepository;
  transactions: ITransactionRepository;
  referrals: IReferralRepository;
  admin: IAdminRepository;
  storage: IStorageRepository;
}
