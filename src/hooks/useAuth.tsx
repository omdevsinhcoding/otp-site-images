import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { db } from '@/lib/database';
import { clearRoleCache } from './useUserRole';
import { clearPermissionsCache } from './useAdminPermissions';

export interface CustomUser {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  created_at: string;
  avatar_url?: string | null;
  is_banned?: boolean;
}

interface AdminSession {
  adminId: string;
  adminUid: string;
  adminEmail: string;
  adminName: string | null;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<CustomUser>) => void;
  impersonateUser: (targetUser: CustomUser, adminSession: AdminSession) => void;
  returnToAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'custom_auth_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingTimerRef = useRef<number | null>(null);

  const startLoading = () => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setLoading(true);
  };

  const stopLoading = () => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = window.setTimeout(() => {
      setLoading(false);
      loadingTimerRef.current = null;
    }, 100); // Reduced from 500ms to 100ms
  };

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    // keep the loader visible briefly (like the reference app)
    stopLoading();

    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    startLoading();
    try {
      const result = await db.auth.registerUser(email, password, name);

      if (!result.success) {
        return { error: new Error(result.error || 'Registration failed') };
      }

      // Auto login after successful registration
      if (result.data?.user) {
        const userData: CustomUser = {
          id: result.data.user.id,
          uid: result.data.user.uid,
          email: result.data.user.email,
          name: result.data.user.name,
          created_at: result.data.user.created_at,
        };
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    } finally {
      stopLoading();
    }
  };

  const signIn = async (email: string, password: string) => {
    startLoading();
    try {
      const result = await db.auth.loginUser(email, password);

      if (!result.success) {
        return { error: new Error(result.error || 'Invalid credentials') };
      }

      if (result.data?.user) {
        const userData: CustomUser = {
          id: result.data.user.id,
          uid: result.data.user.uid,
          email: result.data.user.email,
          name: result.data.user.name,
          created_at: result.data.user.created_at,
          is_banned: result.data.user.is_banned || false,
        };
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    } finally {
      stopLoading();
    }
  };

  const signInWithGoogle = async () => {
    // Google OAuth is not supported with custom auth
    return { error: new Error('Google sign-in is not available with custom authentication') };
  };

  const signOut = async () => {
    // Clear role caches
    clearRoleCache();
    clearPermissionsCache();
    
    // Check if admin is impersonating - return to admin instead of full logout
    const impersonation = localStorage.getItem('admin_impersonation');
    if (impersonation) {
      try {
        const adminSession = JSON.parse(impersonation);
        const adminUser = {
          id: adminSession.adminId,
          uid: adminSession.adminUid,
          email: adminSession.adminEmail,
          name: adminSession.adminName,
          created_at: new Date().toISOString()
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
        localStorage.removeItem('admin_impersonation');
        window.location.href = '/admin';
        return;
      } catch {
        localStorage.removeItem('admin_impersonation');
      }
    }
    
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const updateUser = (updates: Partial<CustomUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const impersonateUser = (targetUser: CustomUser, adminSession: AdminSession) => {
    // Clear caches for clean state
    clearRoleCache();
    clearPermissionsCache();
    
    // Store admin session for returning back
    localStorage.setItem('admin_impersonation', JSON.stringify(adminSession));
    
    // Set target user immediately
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(targetUser));
    setUser(targetUser);
  };

  const returnToAdmin = (): boolean => {
    const impersonation = localStorage.getItem('admin_impersonation');
    if (!impersonation) return false;
    
    try {
      const adminSession: AdminSession = JSON.parse(impersonation);
      
      // Clear caches
      clearRoleCache();
      clearPermissionsCache();
      
      // Restore admin user
      const adminUser: CustomUser = {
        id: adminSession.adminId,
        uid: adminSession.adminUid,
        email: adminSession.adminEmail,
        name: adminSession.adminName,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
      localStorage.removeItem('admin_impersonation');
      setUser(adminUser);
      
      return true;
    } catch {
      localStorage.removeItem('admin_impersonation');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, updateUser, impersonateUser, returnToAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
