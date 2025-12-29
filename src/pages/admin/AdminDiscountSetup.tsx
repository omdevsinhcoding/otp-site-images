import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, Percent, RefreshCw, Search, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserWithDiscount {
  id: string;
  uid: string;
  email: string;
  name: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

function DiscountSetupContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [users, setUsers] = useState<UserWithDiscount[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDiscount | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        p_admin_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; users?: any[]; error?: string };
      
      if (result.success && result.users) {
        const usersWithDiscount: UserWithDiscount[] = result.users.map((u: any) => ({
          id: u.id,
          uid: u.uid,
          email: u.email,
          name: u.name,
          discount_type: u.discount_type || 'percentage',
          discount_value: u.discount_value || 0
        }));
        setUsers(usersWithDiscount);
        setFilteredUsers(usersWithDiscount);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUsers();
    }
  }, [user?.id]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.uid.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query))
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleEditDiscount = (user: UserWithDiscount) => {
    setSelectedUser(user);
    setDiscountType(user.discount_type);
    setDiscountValue(user.discount_value.toString());
    setEditDialogOpen(true);
  };

  const submitDiscount = async () => {
    if (!selectedUser || !user?.id) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      return;
    }

    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) {
      toast({ title: "Invalid", description: "Enter a valid discount value", variant: "destructive" });
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      toast({ title: "Invalid", description: "Percentage cannot exceed 100%", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_user_discount', {
        p_admin_id: user.id,
        p_user_id: selectedUser.id,
        p_discount_type: discountType,
        p_discount_value: value
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, discount_type: discountType, discount_value: value }
            : u
        ));
        setEditDialogOpen(false);
        toast({ title: "Updated", description: `Discount updated for ${selectedUser.email}` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to update", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const usersWithDiscount = users.filter(u => u.discount_value > 0).length;

  return (
    <div className="min-h-screen space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className={cn(
              "p-2 rounded-xl transition-all",
              isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
            )}
          >
            <ArrowLeft className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-600")} />
          </button>
          <div>
            <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              User Discounts
            </h1>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              Set individual discounts for users
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin", isDark ? "text-gray-400" : "text-gray-600")} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn(
          "p-5 rounded-2xl border",
          isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-blue-500/20" : "bg-blue-100")}>
              <Users className={cn("w-5 h-5", isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
            <div>
              <p className={cn("text-xs font-medium", isDark ? "text-gray-500" : "text-gray-500")}>Total Users</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{users.length}</p>
            </div>
          </div>
        </div>
        <div className={cn(
          "p-5 rounded-2xl border",
          isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-purple-500/20" : "bg-purple-100")}>
              <Percent className={cn("w-5 h-5", isDark ? "text-purple-400" : "text-purple-600")} />
            </div>
            <div>
              <p className={cn("text-xs font-medium", isDark ? "text-gray-500" : "text-gray-500")}>With Discount</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{usersWithDiscount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email, UID, or name..."
          className={cn(
            "pl-10 rounded-xl",
            isDark ? "bg-white/5 border-white/10 text-white" : ""
          )}
        />
      </div>

      {/* Users List */}
      <div className={cn(
        "rounded-2xl border overflow-hidden",
        isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b",
          isDark ? "border-white/10 text-gray-500 bg-white/[0.02]" : "border-gray-100 text-gray-500 bg-gray-50"
        )}>
          <div className="col-span-4">User</div>
          <div className="col-span-3">UID</div>
          <div className="col-span-3">Discount</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="px-6 py-16 text-center">
              <RefreshCw className={cn("w-8 h-8 mx-auto mb-3 animate-spin", isDark ? "text-gray-600" : "text-gray-400")} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-500")}>No users found</p>
            </div>
          ) : (
            filteredUsers.map((userItem) => (
              <div
                key={userItem.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors",
                  isDark 
                    ? "hover:bg-white/[0.02] border-b border-white/5 last:border-0" 
                    : "hover:bg-gray-50 border-b border-gray-100 last:border-0"
                )}
              >
                <div className="col-span-4">
                  <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                    {userItem.name || 'No Name'}
                  </p>
                  <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-500")}>{userItem.email}</p>
                </div>
                <div className="col-span-3">
                  <code className={cn("text-xs font-mono", isDark ? "text-gray-400" : "text-gray-600")}>{userItem.uid}</code>
                </div>
                <div className="col-span-3">
                  {userItem.discount_value > 0 ? (
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"
                    )}>
                      {userItem.discount_type === 'percentage' 
                        ? `${userItem.discount_value}%` 
                        : `₹${userItem.discount_value}`}
                    </span>
                  ) : (
                    <span className={cn("text-xs", isDark ? "text-gray-600" : "text-gray-400")}>No discount</span>
                  )}
                </div>
                <div className="col-span-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditDiscount(userItem)}
                    className={cn("text-xs", isDark ? "border-white/10 hover:bg-white/5" : "")}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className={cn("max-w-sm rounded-2xl", isDark ? "bg-gray-900 border-white/10" : "")}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>Edit Discount</DialogTitle>
            <DialogDescription>
              Set discount for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : ""}>Discount Type</Label>
              <Select value={discountType} onValueChange={(v: 'percentage' | 'fixed') => setDiscountType(v)}>
                <SelectTrigger className={isDark ? "bg-white/5 border-white/10 text-white" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : ""}>
                Value {discountType === 'percentage' ? '(%)' : '(₹)'}
              </Label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className={isDark ? "bg-white/5 border-white/10 text-white" : ""}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitDiscount} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDiscountSetup() {
  return (
    <AdminLayout title="User Discounts">
      <DiscountSetupContent />
    </AdminLayout>
  );
}
