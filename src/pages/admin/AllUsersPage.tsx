import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  ArrowLeft, Users, Search, MoreVertical, Wallet, 
  KeyRound, LogIn, Clock, Mail, Calendar, RefreshCw,
  Percent, BadgeDollarSign, ArrowUpDown, ArrowUp, ArrowDown, Filter,
  Ban, ShieldCheck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface UserData {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_active: string | null;
  balance: number;
  total_recharge: number;
  total_otp: number;
  role: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_banned: boolean;
}

interface AdminGetUsersResponse {
  success: boolean;
  users?: UserData[];
  error?: string;
}

interface AdminDiscountResponse {
  success: boolean;
  discount_type?: string;
  discount_value?: number;
  error?: string;
}

interface AdminBalanceResponse {
  success: boolean;
  previous_balance?: number;
  new_balance?: number;
  operation?: string;
  amount?: number;
  error?: string;
}

interface AdminPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface AdminBanResponse {
  success: boolean;
  is_banned?: boolean;
  email?: string;
  message?: string;
  error?: string;
}

function AllUsersContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { user, impersonateUser } = useAuth();
  const permissions = useAdminPermissions(user?.id || null);
  const { toast } = useToast();
  const isDark = resolvedTheme === 'dark';
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'created_at' | 'balance' | 'total_recharge' | 'name' | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [discountFilter, setDiscountFilter] = useState<'all' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline_recent' | 'offline_oldest'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog states
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'credit' | 'debit'>('credit');
  const [balanceNotes, setBalanceNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_id: user.id
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminGetUsersResponse;
      if (response?.success && response?.users) {
        setUsers(response.users);
        setFilteredUsers(response.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.id]);

  useEffect(() => {
    let result = [...users];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.uid.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query))
      );
    }
    
    // Apply discount filter
    if (discountFilter === 'custom') {
      result = result.filter(u => u.discount_value > 0);
    }
    
    // Apply status filter
    if (statusFilter === 'online') {
      result = result.filter(u => {
        const activity = getActivityStatus(u.last_active);
        return activity.status === 'Online' || activity.status === 'Recently Active';
      });
    } else if (statusFilter === 'offline_recent') {
      // Filter offline users and sort by most recently offline first
      result = result.filter(u => {
        const activity = getActivityStatus(u.last_active);
        return activity.status === 'Offline';
      });
      result.sort((a, b) => {
        const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
        return bTime - aTime; // Most recent first
      });
    } else if (statusFilter === 'offline_oldest') {
      // Filter offline users and sort by longest offline first
      result = result.filter(u => {
        const activity = getActivityStatus(u.last_active);
        return activity.status === 'Offline';
      });
      result.sort((a, b) => {
        const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
        return aTime - bTime; // Oldest first
      });
    }
    
    // Apply column sorting (only if status filter doesn't override)
    if (sortColumn && statusFilter !== 'offline_recent' && statusFilter !== 'offline_oldest') {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
          case 'created_at':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'balance':
            comparison = a.balance - b.balance;
            break;
          case 'total_recharge':
            comparison = a.total_recharge - b.total_recharge;
            break;
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    setFilteredUsers(result);
  }, [searchQuery, users, sortColumn, sortDirection, discountFilter, statusFilter]);

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      // Toggle direction or clear
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortColumn(null);
        setSortDirection('desc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className={cn("w-3.5 h-3.5", isDark ? "text-gray-500" : "text-gray-400")} />;
    }
    return sortDirection === 'desc' 
      ? <ArrowDown className="w-3.5 h-3.5 text-primary" /> 
      : <ArrowUp className="w-3.5 h-3.5 text-primary" />;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDiscountFilter = () => {
    if (discountFilter === 'all') {
      setDiscountFilter('custom');
    } else {
      setDiscountFilter('all');
    }
  };

  const handleStatusFilter = () => {
    if (statusFilter === 'all') {
      setStatusFilter('online');
    } else if (statusFilter === 'online') {
      setStatusFilter('offline_recent');
    } else if (statusFilter === 'offline_recent') {
      setStatusFilter('offline_oldest');
    } else {
      setStatusFilter('all');
    }
  };

  const getDiscountFilterIcon = () => {
    if (discountFilter === 'all') {
      return <ArrowUpDown className={cn("w-3.5 h-3.5", isDark ? "text-gray-500" : "text-gray-400")} />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  const getStatusFilterIcon = () => {
    if (statusFilter === 'all') {
      return <ArrowUpDown className={cn("w-3.5 h-3.5", isDark ? "text-gray-500" : "text-gray-400")} />;
    }
    if (statusFilter === 'online') {
      return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    }
    if (statusFilter === 'offline_recent') {
      return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
    }
    return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
  };

  const handleEditBalance = (userData: UserData) => {
    setSelectedUser(userData);
    setBalanceAmount('');
    setBalanceOperation('credit');
    setBalanceNotes('');
    setBalanceDialogOpen(true);
  };

  const handleResetPassword = (userData: UserData) => {
    setSelectedUser(userData);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleEditDiscount = (userData: UserData) => {
    setSelectedUser(userData);
    setDiscountType(userData.discount_type || 'percentage');
    setDiscountValue(String(userData.discount_value || 0));
    setDiscountDialogOpen(true);
  };

  const handleBanUser = async (userData: UserData) => {
    if (!user?.id) return;
    
    const shouldBan = !userData.is_banned;
    setActionLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('admin_ban_user', {
        p_admin_id: user.id,
        p_user_id: userData.id,
        p_ban: shouldBan
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminBanResponse;
      if (response?.success) {
        toast({
          title: shouldBan ? "User Banned" : "User Unbanned",
          description: response.message,
        });
        fetchUsers();
      } else {
        throw new Error(response?.error || 'Failed to update ban status');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update ban status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoginAsUser = (userData: UserData) => {
    if (!user) return;
    
    const targetUser = {
      id: userData.id,
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      created_at: userData.created_at,
      is_banned: userData.is_banned
    };
    
    const adminSession = {
      adminId: user.id,
      adminUid: user.uid,
      adminEmail: user.email,
      adminName: user.name
    };
    
    impersonateUser(targetUser, adminSession);
    
    toast({
      title: "Logged in as user",
    });
    
    // Navigate without reload
    navigate('/', { replace: true });
  };

  const submitBalanceUpdate = async () => {
    if (!selectedUser || !user?.id || !balanceAmount) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_user_balance', {
        p_admin_id: user.id,
        p_user_id: selectedUser.id,
        p_amount: parseFloat(balanceAmount),
        p_operation: balanceOperation,
        p_notes: balanceNotes || null
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminBalanceResponse;
      if (response?.success) {
        toast({
          title: "Balance updated!",
        });
        setBalanceDialogOpen(false);
        fetchUsers();
      } else {
        throw new Error(response?.error || 'Failed to update balance');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update balance",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitPasswordReset = async () => {
    if (!selectedUser || !user?.id || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast({
        title: "Min 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_reset_user_password', {
        p_admin_id: user.id,
        p_user_id: selectedUser.id,
        p_new_password: newPassword
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminPasswordResponse;
      if (response?.success) {
        toast({
          title: "Password reset!",
        });
        setPasswordDialogOpen(false);
      } else {
        throw new Error(response?.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitDiscountUpdate = async () => {
    if (!selectedUser || !user?.id) return;
    
    const discountVal = parseFloat(discountValue) || 0;
    
    if (discountType === 'percentage' && discountVal > 100) {
      toast({
        title: "Max 100%",
        variant: "destructive"
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_user_discount', {
        p_admin_id: user.id,
        p_user_id: selectedUser.id,
        p_discount_type: discountType,
        p_discount_value: discountVal
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminDiscountResponse;
      if (response?.success) {
        toast({
          title: "Discount updated!",
        });
        setDiscountDialogOpen(false);
        fetchUsers();
      } else {
        throw new Error(response?.error || 'Failed to update discount');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return { status: 'Unknown', color: 'gray' };
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return { status: 'Online', color: 'green' };
    if (diffMinutes < 30) return { status: 'Recently Active', color: 'yellow' };
    return { status: 'Offline', color: 'gray' };
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "hover:bg-gray-800 text-gray-400 hover:text-white" 
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}>
              All Users
            </h1>
            <p className={cn(
              "text-sm mt-1",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {users.length} registered users
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          className={cn(
            "font-medium",
            isDark 
              ? "border-gray-700 hover:bg-gray-800" 
              : "border-gray-200 hover:bg-gray-50"
          )}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Total Users</p>
          <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>{users.length}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Online Now</p>
          <p className="text-2xl font-bold mt-1 text-green-500">{users.filter(u => getActivityStatus(u.last_active).status === 'Online').length}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Recently Active</p>
          <p className="text-2xl font-bold mt-1 text-yellow-500">{users.filter(u => getActivityStatus(u.last_active).status === 'Recently Active').length}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Offline</p>
          <p className={cn("text-2xl font-bold mt-1", isDark ? "text-gray-400" : "text-gray-500")}>{users.filter(u => getActivityStatus(u.last_active).status === 'Offline').length}</p>
        </div>
      </div>

      {/* Users Table with Search */}
      <div className={cn(
        "rounded-xl border overflow-hidden",
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
      )}>
        {/* Search Header */}
        <div className={cn(
          "px-4 py-3 border-b flex items-center gap-3",
          isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50/50"
        )}>
          <div className="relative flex-1">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              isDark ? "text-gray-500" : "text-gray-400"
            )} />
            <Input
              placeholder="Search by email, UID, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                isDark ? "placeholder:text-gray-600" : "placeholder:text-gray-400"
              )}
            />
          </div>
          
          {/* Current Filter Indicator */}
          {sortColumn && (
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium",
              isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
            )}>
              {sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              <span>
                {sortColumn === 'name' && 'Sorted by Name'}
                {sortColumn === 'balance' && 'Sorted by Balance'}
                {sortColumn === 'created_at' && 'Sorted by Join Date'}
                {sortColumn === 'total_recharge' && 'Sorted by Recharge'}
              </span>
              <span className="opacity-60">
                {sortColumn === 'created_at' 
                  ? (sortDirection === 'desc' ? '(New to Old)' : '(Old to New)')
                  : sortColumn === 'name'
                    ? (sortDirection === 'desc' ? '(Z to A)' : '(A to Z)')
                    : (sortDirection === 'desc' ? '(High to Low)' : '(Low to High)')
                }
              </span>
              <button 
                onClick={() => { setSortColumn(null); setSortDirection('desc'); }}
                className={cn(
                  "ml-1 rounded p-0.5 transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-primary/20"
                )}
              >
                ✕
              </button>
            </div>
          )}
          
          {/* Discount Filter Indicator */}
          {discountFilter !== 'all' && (
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium",
              isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
            )}>
              <ArrowDown className="w-3 h-3" />
              <span>Custom Discount</span>
              <button 
                onClick={() => setDiscountFilter('all')}
                className={cn(
                  "ml-1 rounded p-0.5 transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-primary/20"
                )}
              >
                ✕
              </button>
            </div>
          )}
          
          {/* Status Filter Indicator */}
          {statusFilter !== 'all' && (
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium",
              isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
            )}>
              {statusFilter === 'online' ? <ArrowUp className="w-3 h-3" /> : statusFilter === 'offline_recent' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              <span>
                {statusFilter === 'online' && 'Recently Online'}
                {statusFilter === 'offline_recent' && 'Offline (New→Old)'}
                {statusFilter === 'offline_oldest' && 'Offline (Old→New)'}
              </span>
              <button 
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "ml-1 rounded p-0.5 transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-primary/20"
                )}
              >
                ✕
              </button>
            </div>
          )}
          
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded ml-auto",
            isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
          )}>
            {filteredUsers.length} results
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className={cn("mt-4 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className={cn("w-10 h-10 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} />
            <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
              {searchQuery 
                ? 'No users found matching your search' 
                : discountFilter !== 'all'
                  ? 'No users with custom discount'
                  : statusFilter !== 'all'
                    ? `No ${statusFilter === 'online' ? 'online' : 'offline'} users found`
                    : 'No users found'
              }
            </p>
            {(searchQuery || discountFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDiscountFilter('all');
                  setStatusFilter('all');
                  setSortColumn('created_at');
                  setSortDirection('desc');
                }}
                className={cn(
                  "mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isDark 
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Fixed Header */}
            <div className={cn(
              "border-b",
              isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50/50"
            )}>
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th 
                      onClick={() => handleSort('name')}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[22%] cursor-pointer select-none transition-colors",
                        isDark ? "text-gray-300 hover:text-white hover:bg-gray-700/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        sortColumn === 'name' && (isDark ? "text-white bg-gray-700/30" : "text-primary bg-primary/5")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        User {getSortIcon('name')}
                      </div>
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[12%]", isDark ? "text-gray-300" : "text-gray-600")}>UID</th>
                    <th 
                      onClick={() => handleSort('balance')}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[12%] cursor-pointer select-none transition-colors",
                        isDark ? "text-gray-300 hover:text-white hover:bg-gray-700/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        sortColumn === 'balance' && (isDark ? "text-white bg-gray-700/30" : "text-primary bg-primary/5")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Balance {getSortIcon('balance')}
                      </div>
                    </th>
                    <th 
                      onClick={handleDiscountFilter}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[14%] cursor-pointer select-none transition-colors",
                        isDark ? "text-gray-300 hover:text-white hover:bg-gray-700/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        discountFilter !== 'all' && (isDark ? "text-white bg-gray-700/30" : "text-primary bg-primary/5")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Discount {getDiscountFilterIcon()}
                      </div>
                    </th>
                    <th 
                      onClick={handleStatusFilter}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[12%] cursor-pointer select-none transition-colors",
                        isDark ? "text-gray-300 hover:text-white hover:bg-gray-700/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        statusFilter !== 'all' && (isDark ? "text-white bg-gray-700/30" : "text-primary bg-primary/5")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Status {getStatusFilterIcon()}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('created_at')}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[12%] cursor-pointer select-none transition-colors",
                        isDark ? "text-gray-300 hover:text-white hover:bg-gray-700/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        sortColumn === 'created_at' && (isDark ? "text-white bg-gray-700/30" : "text-primary bg-primary/5")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Joined {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right w-[16%]", isDark ? "text-gray-300" : "text-gray-600")}>Actions</th>
                  </tr>
                </thead>
              </table>
            </div>
            {/* Scrollable Body - Shows ~5 entries */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <tbody>
                {filteredUsers.map((userData, index) => {
                  const activity = getActivityStatus(userData.last_active);
                  return (
                    <tr 
                      key={userData.id} 
                      className={cn(
                        "transition-colors",
                        index !== filteredUsers.length - 1 && (isDark ? "border-b border-gray-800" : "border-b border-gray-100"),
                        isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                      )}
                    >
                      <td className="px-4 py-4 w-[22%]">
                        <div className="flex items-center gap-3">
                          {userData.avatar_url ? (
                            <OptimizedImage 
                              src={userData.avatar_url} 
                              alt={userData.name || userData.email}
                              className="w-9 h-9 rounded-full"
                            />
                          ) : (
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold",
                              isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
                            )}>
                              {userData.name ? userData.name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={cn("font-medium text-sm truncate", isDark ? "text-white" : "text-gray-900")}>
                              {userData.name || 'No Name'}
                            </p>
                            <p className={cn("text-xs truncate", isDark ? "text-gray-500" : "text-gray-400")}>
                              {userData.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[12%]">
                        <code className={cn(
                          "text-xs px-2 py-1 rounded",
                          isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
                        )}>
                          {userData.uid}
                        </code>
                      </td>
                      <td className="px-4 py-4 w-[12%]">
                        <span className={cn(
                          "text-sm font-semibold",
                          userData.balance > 0 
                            ? "text-green-500" 
                            : (isDark ? "text-gray-400" : "text-gray-500")
                        )}>
                          ₹{userData.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 w-[14%]">
                        {userData.discount_value > 0 ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                            "bg-purple-500/10 text-purple-500"
                          )}>
                            {userData.discount_type === 'percentage' ? (
                              <><Percent className="w-3 h-3" />{userData.discount_value}%</>
                            ) : (
                              <><BadgeDollarSign className="w-3 h-3" />₹{userData.discount_value}</>
                            )}
                          </span>
                        ) : (
                          <span className={cn("text-xs", isDark ? "text-gray-600" : "text-gray-400")}>
                            No discount
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 w-[12%]">
                        {userData.is_banned ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs font-medium text-red-500">Banned</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                activity.color === 'green' && "bg-green-500",
                                activity.color === 'yellow' && "bg-yellow-500",
                                activity.color === 'gray' && "bg-gray-400"
                              )} />
                              <span className={cn(
                                "text-xs font-medium",
                                activity.color === 'green' && "text-green-500",
                                activity.color === 'yellow' && "text-yellow-500",
                                activity.color === 'gray' && (isDark ? "text-gray-500" : "text-gray-400")
                              )}>
                                {activity.status}
                              </span>
                            </div>
                            {userData.last_active && (
                              <p className={cn("text-xs mt-0.5", isDark ? "text-gray-600" : "text-gray-400")}>
                                {formatDistanceToNow(new Date(userData.last_active), { addSuffix: true })}
                              </p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 w-[12%]">
                        <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                          {new Date(userData.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right w-[16%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className={cn(
                              "min-w-[160px]",
                              isDark && "bg-gray-900 border-gray-800"
                            )}
                          >
                            {/* Edit Balance - Manager+ only (blurred for handlers) */}
                            <DropdownMenuItem 
                              onClick={() => permissions.canEditBalance && handleEditBalance(userData)} 
                              disabled={!permissions.canEditBalance}
                              className={cn(
                                "text-sm",
                                permissions.canEditBalance ? "cursor-pointer" : "opacity-50 cursor-not-allowed blur-[0.5px]"
                              )}
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Edit Balance
                            </DropdownMenuItem>
                            {/* Edit Discount - Manager+ only (blurred for handlers) */}
                            <DropdownMenuItem 
                              onClick={() => permissions.canEditBalance && handleEditDiscount(userData)} 
                              disabled={!permissions.canEditBalance}
                              className={cn(
                                "text-sm",
                                permissions.canEditBalance ? "cursor-pointer" : "opacity-50 cursor-not-allowed blur-[0.5px]"
                              )}
                            >
                              <Percent className="w-4 h-4 mr-2" />
                              Edit Discount
                            </DropdownMenuItem>
                            {/* Reset Password - All admins */}
                            {permissions.canResetPasswords && (
                              <DropdownMenuItem 
                                onClick={() => handleResetPassword(userData)} 
                                className="cursor-pointer text-sm"
                              >
                                <KeyRound className="w-4 h-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                            )}
                            {/* Login as User - All admins */}
                            {permissions.canLoginAsUser && (
                              <DropdownMenuItem 
                                onClick={() => handleLoginAsUser(userData)} 
                                className="cursor-pointer text-sm"
                              >
                                <LogIn className="w-4 h-4 mr-2" />
                                Login as User
                              </DropdownMenuItem>
                            )}
                            {/* Ban User - All admins */}
                            {permissions.canBanUsers && (
                              <DropdownMenuItem 
                                onClick={() => handleBanUser(userData)} 
                                className={cn(
                                  "cursor-pointer text-sm",
                                  userData.is_banned ? "text-green-600" : "text-red-600"
                                )}
                              >
                                {userData.is_banned ? (
                                  <>
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Unban User
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Ban User
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle>Edit Balance</DialogTitle>
            <DialogDescription>
              Update balance for {selectedUser?.email}
              <br />
              <span className="font-medium">Current Balance: ₹{selectedUser?.balance.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={balanceOperation === 'credit' ? 'default' : 'outline'}
                onClick={() => setBalanceOperation('credit')}
                className="flex-1"
              >
                Credit (+)
              </Button>
              <Button
                type="button"
                variant={balanceOperation === 'debit' ? 'default' : 'outline'}
                onClick={() => setBalanceOperation('debit')}
                className="flex-1"
              >
                Debit (-)
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Reason for this transaction"
                value={balanceNotes}
                onChange={(e) => setBalanceNotes(e.target.value)}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitBalanceUpdate} disabled={actionLoading || !balanceAmount}>
              {actionLoading ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitPasswordReset} disabled={actionLoading || newPassword.length < 6}>
              {actionLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle>Edit Service Discount</DialogTitle>
            <DialogDescription>
              Set discount for {selectedUser?.email}
              <br />
              <span className="font-medium">
                Current: {selectedUser?.discount_value || 0}{selectedUser?.discount_type === 'percentage' ? '%' : '₹'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(val: 'percentage' | 'fixed') => setDiscountType(val)}>
                <SelectTrigger className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Percentage (%)
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <BadgeDollarSign className="w-4 h-4" />
                      Fixed Amount (₹)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-value">
                Discount Value {discountType === 'percentage' ? '(0-100%)' : '(₹)'}
              </Label>
              <Input
                id="discount-value"
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : undefined}
                step="0.01"
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
              <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                {discountType === 'percentage' 
                  ? 'User will get this % off on all services' 
                  : 'User will get ₹ off on each service'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitDiscountUpdate} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Discount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AllUsersPage() {
  return (
    <AdminLayout title="All Users">
      <AllUsersContent />
    </AdminLayout>
  );
}