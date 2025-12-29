import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPermissions, getRoleInfo, AdminRole } from '@/hooks/useAdminPermissions';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Shield, Search, MoreVertical, UserPlus, Crown,
  Users, Briefcase, Headphones, Trash2, Settings, RefreshCw,
  Mail, Calendar, Clock, ShieldCheck, ShieldAlert, ArrowUpDown, Loader2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { UserSelectionDialog } from '@/components/admin/UserSelectionDialog';

interface AdminData {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  role: AdminRole;
  level: number;
  created_at: string;
  last_active: string | null;
}

interface UserData {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  created_at: string;
  balance?: number;
  total_recharge?: number;
  total_otp?: number;
  role?: string;
  discount_type?: string;
  discount_value?: number;
  is_banned?: boolean;
  last_active?: string | null;
}

interface GetAllAdminsResponse {
  success: boolean;
  admins?: AdminData[];
  error?: string;
}

interface SetRoleResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  new_role?: string;
  error?: string;
}

interface RemoveRoleResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  message?: string;
  error?: string;
}

interface GetAllUsersResponse {
  success: boolean;
  users?: UserData[];
  error?: string;
}

function AdminManagementContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { user } = useAuth();
  const permissions = useAdminPermissions(user?.id || null);
  const { toast } = useToast();
  const isDark = resolvedTheme === 'dark';
  
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Dialog states
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [userSelectionDialogOpen, setUserSelectionDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [removeAdminDialogOpen, setRemoveAdminDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('handler');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_all_admins', {
        p_requester_id: user.id
      });
      
      if (error) throw error;
      
      const response = data as unknown as GetAllAdminsResponse;
      if (response?.success && response?.admins) {
        setAdmins(response.admins);
        setFilteredAdmins(response.admins);
      } else if (response?.error) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Access Denied",
        description: error.message || "Only owners can access admin management",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllUsers = async () => {
    if (!user?.id) return;
    
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_id: user.id
      });
      
      if (error) throw error;
      
      const response = data as unknown as GetAllUsersResponse;
      console.log('Fetched users response:', response);
      if (response?.success && response?.users) {
        console.log('Setting users:', response.users.length);
        setAllUsers(response.users);
      } else if (response?.error) {
        console.error('Admin get users error:', response.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.isOwner && !permissions.loading) {
      fetchAdmins();
      fetchAllUsers();
    } else if (!permissions.loading && !permissions.isOwner) {
      setLoading(false);
    }
  }, [user?.id, permissions.isOwner, permissions.loading]);

  useEffect(() => {
    let result = [...admins];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.email.toLowerCase().includes(query) ||
        a.uid.toLowerCase().includes(query) ||
        (a.name && a.name.toLowerCase().includes(query)) ||
        a.role.toLowerCase().includes(query)
      );
    }
    
    setFilteredAdmins(result);
  }, [searchQuery, admins]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdmins();
  };

  const handleAddAdmin = () => {
    setSelectedUserId('');
    setSelectedRole('handler');
    // Always fetch users when dialog opens to ensure fresh data
    fetchAllUsers();
    setAddAdminDialogOpen(true);
  };

  const handleEditRole = (admin: AdminData) => {
    setSelectedAdmin(admin);
    setSelectedRole(admin.role);
    setEditRoleDialogOpen(true);
  };

  const handleRemoveAdmin = (admin: AdminData) => {
    setSelectedAdmin(admin);
    setRemoveAdminDialogOpen(true);
  };

  const submitAddAdmin = async () => {
    if (!user?.id || !selectedUserId || !selectedRole) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        p_owner_id: user.id,
        p_target_user_id: selectedUserId,
        p_new_role: selectedRole
      });
      
      if (error) throw error;
      
      const response = data as unknown as SetRoleResponse;
      if (response?.success) {
        toast({
          title: "Admin Added",
          description: `${response.email} is now a ${selectedRole}`,
        });
        setAddAdminDialogOpen(false);
        fetchAdmins();
      } else {
        throw new Error(response?.error || 'Failed to add admin');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitEditRole = async () => {
    if (!user?.id || !selectedAdmin || !selectedRole) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        p_owner_id: user.id,
        p_target_user_id: selectedAdmin.id,
        p_new_role: selectedRole
      });
      
      if (error) throw error;
      
      const response = data as unknown as SetRoleResponse;
      if (response?.success) {
        toast({
          title: "Role Updated",
          description: `${response.email} is now a ${selectedRole}`,
        });
        setEditRoleDialogOpen(false);
        fetchAdmins();
      } else {
        throw new Error(response?.error || 'Failed to update role');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitRemoveAdmin = async () => {
    if (!user?.id || !selectedAdmin) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_remove_user_role', {
        p_owner_id: user.id,
        p_target_user_id: selectedAdmin.id
      });
      
      if (error) throw error;
      
      const response = data as unknown as RemoveRoleResponse;
      if (response?.success) {
        toast({
          title: "Admin Removed",
          description: response.message,
        });
        setRemoveAdminDialogOpen(false);
        fetchAdmins();
      } else {
        throw new Error(response?.error || 'Failed to remove admin');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get admin IDs for exclusion
  const adminIds = admins.map(a => a.id);

  // Stats calculations
  const ownerCount = admins.filter(a => a.role === 'owner').length;
  const managerCount = admins.filter(a => a.role === 'manager' || a.role === 'admin').length;
  const handlerCount = admins.filter(a => a.role === 'handler' || a.role === 'moderator').length;

  if (!permissions.loading && !permissions.isOwner) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] gap-4",
        isDark ? "text-gray-400" : "text-gray-500"
      )}>
        <ShieldAlert className="w-16 h-16 opacity-50" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm">Only owners can access admin management.</p>
        <Button onClick={() => navigate('/admin')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin')}
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
          isDark 
            ? "bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50 hover:border-gray-600" 
            : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-lg"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>

      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Admins */}
        <div className={cn(
          "rounded-2xl p-5 border backdrop-blur-sm",
          isDark 
            ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50" 
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              isDark ? "bg-indigo-500/20" : "bg-indigo-100"
            )}>
              <Shield className={cn("w-6 h-6", isDark ? "text-indigo-400" : "text-indigo-600")} />
            </div>
            <div>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Total Admins</p>
              <p className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                {loading ? '...' : admins.length}
              </p>
            </div>
          </div>
        </div>

        {/* Owners */}
        <div className={cn(
          "rounded-2xl p-5 border backdrop-blur-sm",
          isDark 
            ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700/30" 
            : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              isDark ? "bg-amber-500/20" : "bg-amber-100"
            )}>
              <Crown className={cn("w-6 h-6", isDark ? "text-amber-400" : "text-amber-600")} />
            </div>
            <div>
              <p className={cn("text-sm", isDark ? "text-amber-400/80" : "text-amber-600")}>Owners</p>
              <p className={cn("text-2xl font-bold", isDark ? "text-amber-400" : "text-amber-700")}>
                {loading ? '...' : ownerCount}
              </p>
            </div>
          </div>
        </div>

        {/* Managers */}
        <div className={cn(
          "rounded-2xl p-5 border backdrop-blur-sm",
          isDark 
            ? "bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-700/30" 
            : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              isDark ? "bg-purple-500/20" : "bg-purple-100"
            )}>
              <Briefcase className={cn("w-6 h-6", isDark ? "text-purple-400" : "text-purple-600")} />
            </div>
            <div>
              <p className={cn("text-sm", isDark ? "text-purple-400/80" : "text-purple-600")}>Managers</p>
              <p className={cn("text-2xl font-bold", isDark ? "text-purple-400" : "text-purple-700")}>
                {loading ? '...' : managerCount}
              </p>
            </div>
          </div>
        </div>

        {/* Handlers */}
        <div className={cn(
          "rounded-2xl p-5 border backdrop-blur-sm",
          isDark 
            ? "bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/30" 
            : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              isDark ? "bg-blue-500/20" : "bg-blue-100"
            )}>
              <Headphones className={cn("w-6 h-6", isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
            <div>
              <p className={cn("text-sm", isDark ? "text-blue-400/80" : "text-blue-600")}>Handlers</p>
              <p className={cn("text-2xl font-bold", isDark ? "text-blue-400" : "text-blue-700")}>
                {loading ? '...' : handlerCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            isDark ? "text-gray-500" : "text-gray-400"
          )} />
          <Input
            placeholder="Search admins by email, UID, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputSize="sm"
            className={cn(
              "pl-10",
              isDark 
                ? "bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 focus:border-indigo-500" 
                : "bg-white border-gray-200 hover:bg-gray-50 focus:border-indigo-500"
            )}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={refreshing}
            className={cn(
              "rounded-xl",
              isDark 
                ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white" 
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
          
          <Button
            onClick={handleAddAdmin}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Admins Table */}
      <div className={cn(
        "rounded-2xl border overflow-hidden",
        isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200 shadow-xl"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                "border-b",
                isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
              )}>
                <th className={cn(
                  "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  Admin
                </th>
                <th className={cn(
                  "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  Role
                </th>
                <th className={cn(
                  "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  Added
                </th>
                <th className={cn(
                  "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  Last Active
                </th>
                <th className={cn(
                  "px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Shield className={cn(
                      "w-12 h-12 mx-auto mb-3 opacity-30",
                      isDark ? "text-gray-600" : "text-gray-400"
                    )} />
                    <p className={isDark ? "text-gray-500" : "text-gray-400"}>
                      {searchQuery ? 'No admins found matching your search' : 'No admins configured yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const roleInfo = getRoleInfo(admin.role);
                  const isCurrentUser = admin.id === user?.id;
                  
                  return (
                    <tr 
                      key={admin.id}
                      className={cn(
                        "transition-colors",
                        isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                            `bg-gradient-to-br ${roleInfo.color}`
                          )}>
                            {admin.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium",
                              isDark ? "text-white" : "text-gray-900"
                            )}>
                              {admin.name || admin.email.split('@')[0]}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-indigo-400">(You)</span>
                              )}
                            </p>
                            <p className={cn(
                              "text-sm",
                              isDark ? "text-gray-400" : "text-gray-500"
                            )}>
                              {admin.email}
                            </p>
                            <p className={cn(
                              "text-xs font-mono",
                              isDark ? "text-gray-500" : "text-gray-400"
                            )}>
                              {admin.uid}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                          roleInfo.bgColor, roleInfo.textColor
                        )}>
                          {admin.role === 'owner' && <Crown className="w-3.5 h-3.5" />}
                          {admin.role === 'manager' && <Briefcase className="w-3.5 h-3.5" />}
                          {admin.role === 'handler' && <Headphones className="w-3.5 h-3.5" />}
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={cn(
                          "text-sm",
                          isDark ? "text-gray-300" : "text-gray-600"
                        )}>
                          {format(new Date(admin.created_at), 'MMM dd, yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={cn(
                          "text-sm",
                          isDark ? "text-gray-400" : "text-gray-500"
                        )}>
                          {admin.last_active 
                            ? formatDistanceToNow(new Date(admin.last_active), { addSuffix: true })
                            : 'Never'
                          }
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className={cn(
                                "rounded-lg",
                                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                              )}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end"
                            className={cn(
                              "w-48 rounded-xl",
                              isDark ? "bg-gray-800 border-gray-700" : ""
                            )}
                          >
                            <DropdownMenuItem 
                              onClick={() => handleEditRole(admin)}
                              className="rounded-lg"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleRemoveAdmin(admin)}
                              className="rounded-lg text-red-500 focus:text-red-500"
                              disabled={isCurrentUser}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className={cn(
        "rounded-2xl p-6 border",
        isDark 
          ? "bg-gray-900/50 border-gray-800" 
          : "bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-lg"
      )}>
        <h3 className={cn(
          "text-lg font-semibold mb-4 flex items-center gap-2",
          isDark ? "text-white" : "text-gray-900"
        )}>
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          Role Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Owner */}
          <div className={cn(
            "rounded-xl p-4 border",
            isDark ? "bg-amber-900/20 border-amber-700/30" : "bg-amber-50 border-amber-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-500">Owner</span>
            </div>
            <ul className={cn(
              "text-sm space-y-1",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              <li>✓ Full access to everything</li>
              <li>✓ Manage other admins</li>
              <li>✓ Access all settings</li>
            </ul>
          </div>

          {/* Manager */}
          <div className={cn(
            "rounded-xl p-4 border",
            isDark ? "bg-purple-900/20 border-purple-700/30" : "bg-purple-50 border-purple-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-purple-500">Manager</span>
            </div>
            <ul className={cn(
              "text-sm space-y-1",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              <li>✓ All user management</li>
              <li>✓ Balance & payments</li>
              <li>✓ Services & analytics</li>
              <li>✗ Cannot manage admins</li>
            </ul>
          </div>

          {/* Handler */}
          <div className={cn(
            "rounded-xl p-4 border",
            isDark ? "bg-blue-900/20 border-blue-700/30" : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Headphones className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-500">Handler</span>
            </div>
            <ul className={cn(
              "text-sm space-y-1",
              isDark ? "text-gray-300" : "text-gray-600"
            )}>
              <li>✓ User management</li>
              <li>✓ Ban/Unban users</li>
              <li>✓ Reset passwords</li>
              <li>✗ No balance access</li>
              <li>✗ No admin access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-md rounded-2xl",
          isDark ? "bg-gray-900 border-gray-800" : ""
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Add New Admin
            </DialogTitle>
            <DialogDescription>
              Select a user and assign them an admin role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* User Selection Button */}
            <div className="space-y-2">
              <Label>Select User</Label>
              <Button
                variant="outline"
                onClick={() => setUserSelectionDialogOpen(true)}
                className={cn(
                  "w-full justify-between h-auto py-3",
                  isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : ""
                )}
              >
                {selectedUserId ? (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs",
                      "bg-gradient-to-br from-indigo-500 to-purple-600"
                    )}>
                      {allUsers.find(u => u.id === selectedUserId)?.email.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                        {allUsers.find(u => u.id === selectedUserId)?.name || 
                         allUsers.find(u => u.id === selectedUserId)?.email.split('@')[0] || 
                         'Selected User'}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                        {allUsers.find(u => u.id === selectedUserId)?.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    Click to select a user...
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminRole)}>
                <SelectTrigger className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectItem value="handler">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-blue-500" />
                      Handler - Limited access
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      Manager - Full access (except admins)
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Owner - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitAddAdmin}
              disabled={actionLoading || !selectedUserId}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {actionLoading ? 'Adding...' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Selection Dialog */}
      <UserSelectionDialog
        open={userSelectionDialogOpen}
        onOpenChange={setUserSelectionDialogOpen}
        users={allUsers}
        loading={usersLoading}
        selectedUserId={selectedUserId}
        onSelect={setSelectedUserId}
        title="Select User"
        description="Search and select a user to add as admin."
        existingAdminIds={adminIds}
      />

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-md rounded-2xl",
          isDark ? "bg-gray-900 border-gray-800" : ""
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Change Admin Role
            </DialogTitle>
            <DialogDescription>
              Update the role for {selectedAdmin?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminRole)}>
                <SelectTrigger className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectItem value="handler">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-blue-500" />
                      Handler - Limited access
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      Manager - Full access (except admins)
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Owner - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitEditRole}
              disabled={actionLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {actionLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Dialog */}
      <Dialog open={removeAdminDialogOpen} onOpenChange={setRemoveAdminDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-md rounded-2xl",
          isDark ? "bg-gray-900 border-gray-800" : ""
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" />
              Remove Admin
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove admin privileges from {selectedAdmin?.email}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitRemoveAdmin}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? 'Removing...' : 'Remove Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminManagementPage() {
  return (
    <AdminLayout title="Admin Management">
      <AdminManagementContent />
    </AdminLayout>
  );
}
