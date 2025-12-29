import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  ArrowLeft, Ban, Search, MoreVertical, ShieldCheck, Wallet,
  Clock, Mail, Calendar, RefreshCw, Users, KeyRound, LogIn,
  ArrowUpDown, ArrowUp, ArrowDown, Percent, BadgeDollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface AdminBanResponse {
  success: boolean;
  is_banned?: boolean;
  email?: string;
  message?: string;
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

interface AdminDiscountResponse {
  success: boolean;
  discount_type?: string;
  discount_value?: number;
  error?: string;
}

function BannedUsersContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { user, impersonateUser } = useAuth();
  const permissions = useAdminPermissions(user?.id || null);
  const { toast } = useToast();
  const isDark = resolvedTheme === 'dark';
  
  const [bannedUsers, setBannedUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'created_at' | 'balance' | 'total_recharge' | 'name' | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog states
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
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

  const fetchBannedUsers = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_id: user.id
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminGetUsersResponse;
      if (response?.success && response?.users) {
        const banned = response.users.filter(u => u.is_banned);
        setBannedUsers(banned);
        setFilteredUsers(banned);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch banned users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBannedUsers();
  }, [user?.id]);

  useEffect(() => {
    let result = [...bannedUsers];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.uid.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query))
      );
    }
    
    // Apply column sorting
    if (sortColumn) {
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
  }, [searchQuery, bannedUsers, sortColumn, sortDirection]);

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
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
    fetchBannedUsers();
  };

  const handleUnbanClick = (userData: UserData) => {
    setSelectedUser(userData);
    setUnbanDialogOpen(true);
  };

  const handleUnbanUser = async () => {
    if (!user?.id || !selectedUser) return;
    
    setActionLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('admin_ban_user', {
        p_admin_id: user.id,
        p_user_id: selectedUser.id,
        p_ban: false
      });
      
      if (error) throw error;
      
      const response = data as unknown as AdminBanResponse;
      if (response?.success) {
        toast({
          title: "User Unbanned",
          description: response.message,
        });
        setUnbanDialogOpen(false);
        fetchBannedUsers();
      } else {
        throw new Error(response?.error || 'Failed to unban user');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
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
          title: "Balance Updated",
          description: `${balanceOperation === 'credit' ? 'Added' : 'Deducted'} ₹${balanceAmount}. New balance: ₹${response.new_balance}`,
        });
        setBalanceDialogOpen(false);
        fetchBannedUsers();
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
        title: "Error",
        description: "Password must be at least 6 characters",
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
          title: "Password Reset",
          description: `Password has been reset for ${selectedUser.email}`,
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
        title: "Error",
        description: "Percentage discount cannot exceed 100%",
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
          title: "Discount Updated",
          description: `Set ${discountVal}${discountType === 'percentage' ? '%' : '₹'} discount for ${selectedUser.email}`,
        });
        setDiscountDialogOpen(false);
        fetchBannedUsers();
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

  // Calculate stats
  const totalFrozenBalance = bannedUsers.reduce((sum, u) => sum + u.balance, 0);
  const totalFrozenRecharge = bannedUsers.reduce((sum, u) => sum + u.total_recharge, 0);

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
              Banned Users
            </h1>
            <p className={cn(
              "text-sm mt-1",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {bannedUsers.length} suspended accounts
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
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Banned Users</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{bannedUsers.length}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Frozen Balance</p>
          <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>₹{totalFrozenBalance.toFixed(2)}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Total Recharge</p>
          <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>₹{totalFrozenRecharge.toFixed(2)}</p>
        </div>
        <div className={cn(
          "p-4 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"
        )}>
          <p className={cn("text-xs font-medium uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>Avg Balance</p>
          <p className={cn("text-2xl font-bold mt-1", isDark ? "text-white" : "text-gray-900")}>
            ₹{bannedUsers.length > 0 ? (totalFrozenBalance / bannedUsers.length).toFixed(2) : '0.00'}
          </p>
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
          
          {/* Current Sort Indicator */}
          {sortColumn && (
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium",
              isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
            )}>
              {sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              <span>
                {sortColumn === 'name' && 'Sorted by Name'}
                {sortColumn === 'balance' && 'Sorted by Balance'}
                {sortColumn === 'created_at' && 'Sorted by Ban Date'}
                {sortColumn === 'total_recharge' && 'Sorted by Recharge'}
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
              Loading banned users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className={cn("w-10 h-10 mx-auto mb-3 text-green-500")} />
            <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
              {searchQuery 
                ? 'No banned users found matching your search' 
                : 'No banned users - all accounts are in good standing'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={cn(
                  "mt-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isDark 
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                Clear search
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
                      onClick={() => handleSort('total_recharge')}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[14%] cursor-pointer select-none transition-colors",
                        isDark ? "text-gray-300 hover:text-white hover:bg-gray-700/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                        sortColumn === 'total_recharge' && (isDark ? "text-white bg-gray-700/30" : "text-primary bg-primary/5")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Recharge {getSortIcon('total_recharge')}
                      </div>
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider w-[12%]", isDark ? "text-gray-300" : "text-gray-600")}>Status</th>
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
            
            {/* Scrollable Body */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <tbody>
                {filteredUsers.map((userData, index) => {
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
                              className="w-9 h-9 rounded-full ring-2 ring-red-500/30"
                            />
                          ) : (
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-red-500/30",
                              "bg-gradient-to-br from-red-500 to-rose-600 text-white"
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
                        <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                          ₹{userData.total_recharge.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 w-[12%]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-medium text-red-500">Banned</span>
                        </div>
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
                            {/* Unban User - All admins */}
                            {permissions.canBanUsers && (
                              <DropdownMenuItem 
                                onClick={() => handleUnbanClick(userData)} 
                                className="cursor-pointer text-sm text-green-600"
                              >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            )}
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

      {/* Unban Confirmation Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-800" : ""}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Unban User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unban <strong>{selectedUser?.email}</strong>? 
              They will regain full access to their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setUnbanDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnbanUser}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Unbanning...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Confirm Unban
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-800" : ""}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Edit Balance
            </DialogTitle>
            <DialogDescription>
              Update balance for <strong>{selectedUser?.email}</strong>
              <br />
              Current balance: <strong>₹{selectedUser?.balance.toFixed(2)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Operation</Label>
              <Select value={balanceOperation} onValueChange={(v: 'credit' | 'debit') => setBalanceOperation(v)}>
                <SelectTrigger className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectItem value="credit">Credit (Add)</SelectItem>
                  <SelectItem value="debit">Debit (Subtract)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="Enter amount"
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={balanceNotes}
                onChange={(e) => setBalanceNotes(e.target.value)}
                placeholder="Reason for adjustment"
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={submitBalanceUpdate} disabled={actionLoading || !balanceAmount}>
              {actionLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-800" : ""}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={submitPasswordReset} disabled={actionLoading || newPassword.length < 6}>
              {actionLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className={isDark ? "bg-gray-900 border-gray-800" : ""}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              Edit Discount
            </DialogTitle>
            <DialogDescription>
              Update discount for <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(v: 'percentage' | 'fixed') => setDiscountType(v)}>
                <SelectTrigger className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Value</Label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? "e.g., 10 for 10%" : "e.g., 50 for ₹50"}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={submitDiscountUpdate} disabled={actionLoading}>
              {actionLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BannedUsersPage() {
  return (
    <AdminLayout title="Banned Users">
      <BannedUsersContent />
    </AdminLayout>
  );
}
