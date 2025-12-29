import type { IDatabaseService } from '../interfaces';
import { SupabaseAuthRepository } from './auth-repository';
import { SupabaseUserRepository } from './user-repository';
import { SupabaseTransactionRepository } from './transaction-repository';
import { SupabaseReferralRepository } from './referral-repository';
import { SupabaseAdminRepository } from './admin-repository';
import { SupabaseStorageRepository } from './storage-repository';

export class SupabaseDatabaseService implements IDatabaseService {
  public auth: SupabaseAuthRepository;
  public users: SupabaseUserRepository;
  public transactions: SupabaseTransactionRepository;
  public referrals: SupabaseReferralRepository;
  public admin: SupabaseAdminRepository;
  public storage: SupabaseStorageRepository;

  constructor() {
    this.auth = new SupabaseAuthRepository();
    this.users = new SupabaseUserRepository();
    this.transactions = new SupabaseTransactionRepository();
    this.referrals = new SupabaseReferralRepository();
    this.admin = new SupabaseAdminRepository();
    this.storage = new SupabaseStorageRepository();
  }
}

// Singleton instance
export const supabaseDb = new SupabaseDatabaseService();
