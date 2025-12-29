// Database abstraction layer - Supabase

// Export types
export * from './types';

// Export interfaces
export * from './interfaces';

// Supabase database service
export { supabaseDb as db } from './supabase';

// Also export the interface type for typing
export type { IDatabaseService } from './interfaces';
