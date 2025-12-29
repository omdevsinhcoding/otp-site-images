import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'owner' | 'manager' | 'handler' | 'admin' | 'moderator' | 'user';

export interface AdminPermissions {
  role: AdminRole;
  level: number;
  isAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isHandler: boolean;
  loading: boolean;
  
  // Feature-specific permissions
  canManageAdmins: boolean;        // Only owner
  canEditBalance: boolean;         // Manager and owner only
  canEditServices: boolean;        // Manager and owner only
  canViewAnalytics: boolean;       // Manager and owner only
  canManageSEO: boolean;           // Manager and owner only
  canManageTheme: boolean;         // Manager and owner only
  canManagePayments: boolean;      // Manager and owner only
  canManageSettings: boolean;      // Manager and owner only
  canManageNumberWaiting: boolean; // Manager and owner only
  canManageUsers: boolean;         // All admins
  canResetPasswords: boolean;      // All admins
  canBanUsers: boolean;            // All admins
  canManageNotifications: boolean; // All admins
  canManageFooter: boolean;        // All admins
  canManageReadymade: boolean;     // All admins
  canLoginAsUser: boolean;         // All admins
}

const defaultPermissions: AdminPermissions = {
  role: 'user',
  level: 0,
  isAdmin: false,
  isOwner: false,
  isManager: false,
  isHandler: false,
  loading: true,
  canManageAdmins: false,
  canEditBalance: false,
  canEditServices: false,
  canViewAnalytics: false,
  canManageSEO: false,
  canManageTheme: false,
  canManagePayments: false,
  canManageSettings: false,
  canManageNumberWaiting: false,
  canManageUsers: false,
  canResetPasswords: false,
  canBanUsers: false,
  canManageNotifications: false,
  canManageFooter: false,
  canManageReadymade: false,
  canLoginAsUser: false,
};

interface AdminRoleResponse {
  role: AdminRole;
  level: number;
  is_admin: boolean;
  is_owner: boolean;
  is_manager: boolean;
  is_handler: boolean;
}

// Cache for admin permissions
const permissionsCache: { [key: string]: { permissions: AdminPermissions; timestamp: number } } = {};
const CACHE_TTL = 30000; // 30 seconds

export function useAdminPermissions(userId: string | null): AdminPermissions {
  const [permissions, setPermissions] = useState<AdminPermissions>(defaultPermissions);
  const fetchingRef = useRef(false);

  useEffect(() => {
    async function fetchPermissions() {
      if (!userId) {
        setPermissions({ ...defaultPermissions, loading: false });
        return;
      }

      // Check cache first
      const cached = permissionsCache[userId];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setPermissions(cached.permissions);
        return;
      }

      // Prevent duplicate fetches
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const { data, error } = await supabase.rpc('get_admin_role', {
          p_user_id: userId
        });

        if (error) throw error;

        const response = data as unknown as AdminRoleResponse;
        const level = response?.level || 0;
        const isOwner = response?.is_owner || false;
        const isManager = response?.is_manager || false;
        const isHandler = response?.is_handler || false;

        const newPermissions: AdminPermissions = {
          role: response?.role || 'user',
          level,
          isAdmin: response?.is_admin || false,
          isOwner,
          isManager,
          isHandler,
          loading: false,
          
          // Owner only
          canManageAdmins: isOwner,
          
          // Manager and owner only (level >= 2)
          canEditBalance: level >= 2,
          canEditServices: level >= 2,
          canViewAnalytics: level >= 2,
          canManageSEO: level >= 2,
          canManageTheme: level >= 2,
          canManagePayments: level >= 2,
          canManageSettings: level >= 2,
          canManageNumberWaiting: level >= 2,
          
          // All admins (level >= 1)
          canManageUsers: level >= 1,
          canResetPasswords: level >= 1,
          canBanUsers: level >= 1,
          canManageNotifications: level >= 1,
          canManageFooter: level >= 1,
          canManageReadymade: level >= 1,
          canLoginAsUser: level >= 1,
        };

        // Cache the result
        permissionsCache[userId] = {
          permissions: newPermissions,
          timestamp: Date.now()
        };

        setPermissions(newPermissions);
      } catch (error) {
        console.error('Error fetching admin permissions:', error);
        setPermissions({ ...defaultPermissions, loading: false });
      } finally {
        fetchingRef.current = false;
      }
    }

    fetchPermissions();
  }, [userId]);

  return permissions;
}

// Export function to clear cache
export function clearPermissionsCache() {
  Object.keys(permissionsCache).forEach(key => delete permissionsCache[key]);
}

// Helper to get role display info
export function getRoleInfo(role: AdminRole) {
  switch (role) {
    case 'owner':
      return { 
        label: 'Owner', 
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-500',
        description: 'Full access to everything' 
      };
    case 'manager':
      return { 
        label: 'Manager', 
        color: 'from-purple-500 to-indigo-600',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
        description: 'Full access except admin management' 
      };
    case 'handler':
      return { 
        label: 'Handler', 
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
        description: 'Limited access - user management only' 
      };
    case 'admin':
      return { 
        label: 'Admin', 
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
        description: 'Legacy admin role (treated as manager)' 
      };
    case 'moderator':
      return { 
        label: 'Moderator', 
        color: 'from-gray-500 to-slate-600',
        bgColor: 'bg-gray-500/10',
        textColor: 'text-gray-500',
        description: 'Legacy moderator role' 
      };
    default:
      return { 
        label: 'User', 
        color: 'from-gray-400 to-gray-500',
        bgColor: 'bg-gray-400/10',
        textColor: 'text-gray-400',
        description: 'Regular user' 
      };
  }
}
