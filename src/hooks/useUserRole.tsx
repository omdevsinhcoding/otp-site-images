import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/database';

type AppRole = 'owner' | 'manager' | 'handler' | 'admin' | 'moderator' | 'user' | null;

// Simple cache to prevent duplicate API calls
const roleCache: { [key: string]: { role: AppRole; isAdmin: boolean; timestamp: number } } = {};
const CACHE_TTL = 30000; // 30 seconds

export function useUserRole(userId: string | null) {
  const [role, setRole] = useState<AppRole>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        if (hasCheckedRef.current) {
          setRole(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // Check cache first
      const cached = roleCache[userId];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setRole(cached.role);
        setIsAdmin(cached.isAdmin);
        setLoading(false);
        hasCheckedRef.current = true;
        return;
      }

      hasCheckedRef.current = true;
      setLoading(true);

      try {
        const fetchedRole = await db.users.getUserRole(userId);
        const adminRoles = ['owner', 'manager', 'handler', 'admin', 'moderator'];
        const isAdminRole = adminRoles.includes(fetchedRole);
        
        // Cache the result
        roleCache[userId] = {
          role: fetchedRole as AppRole,
          isAdmin: isAdminRole,
          timestamp: Date.now()
        };
        
        setRole(fetchedRole as AppRole);
        setIsAdmin(isAdminRole);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [userId]);

  return { role, isAdmin, loading };
}

// Export function to clear cache (useful on logout)
export function clearRoleCache() {
  Object.keys(roleCache).forEach(key => delete roleCache[key]);
}
