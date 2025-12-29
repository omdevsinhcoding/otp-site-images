import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, Ticket, Copy, Check, 
  RefreshCw, Trash2, Plus, Sparkles,
  Eye, EyeOff, Shuffle, Gift,
  Users, IndianRupee
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PromoCode {
  id: string;
  code: string;
  amount: number;
  max_redemptions: number;
  current_redemptions: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

function PromoCodesContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [amount, setAmount] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null);

  const fetchPromoCodes = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('admin_get_promo_codes', {
        p_admin_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; promos?: any[]; error?: string };
      
      if (result.success && result.promos) {
        setPromoCodes(result.promos.map((p: any) => ({
          id: p.id,
          code: p.code,
          amount: p.amount,
          max_redemptions: p.max_redemptions,
          current_redemptions: p.current_redemptions,
          is_active: p.is_active,
          expires_at: p.expires_at,
          created_at: p.created_at
        })));
      }
    } catch (error) {
      toast({ title: "Load failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPromoCodes();
      
      // Subscribe to real-time updates on promo_codes table
      const channel = supabase
        .channel('promo-codes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'promo_codes'
          },
          (payload) => {
            console.log('Promo code change detected:', payload);
            // Refetch to get updated data
            fetchPromoCodes();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const length = Math.floor(Math.random() * 5) + 8; // 8-12 chars
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromoCode(result);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({ title: "Copied!" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleCreatePromo = () => {
    setPromoCode('');
    setAmount('');
    setMaxRedemptions('');
    setExpiryDate('');
    setCreateDialogOpen(true);
  };

  const handleDeletePromo = (promo: PromoCode) => {
    setPromoToDelete(promo);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (promoId: string) => {
    if (!user?.id) return;

    toast({ title: "Updating..." });

    try {
      const { data, error } = await supabase.rpc('admin_toggle_promo_code', {
        p_admin_id: user.id,
        p_promo_id: promoId
      });

      if (error) throw error;

      const result = data as { success: boolean; is_active?: boolean; error?: string };
      
      if (result.success) {
        setPromoCodes(prev => prev.map(p => 
          p.id === promoId ? { ...p, is_active: result.is_active ?? !p.is_active } : p
        ));
        toast({
          title: result.is_active ? "Activated" : "Deactivated",
        });
      } else {
        toast({ title: "Update failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const submitCreatePromo = async () => {
    if (!user?.id) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }

    // Validate promo code
    if (!promoCode.trim()) {
      toast({ title: "Enter code", variant: "destructive" });
      return;
    }

    if (promoCode.length < 8) {
      toast({ title: "Min 8 characters", variant: "destructive" });
      return;
    }

    if (promoCode.length > 14) {
      toast({ title: "Max 14 characters", variant: "destructive" });
      return;
    }

    // Validate amount
    if (!amount.trim()) {
      toast({ title: "Enter amount", variant: "destructive" });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    // Validate max uses
    if (!maxRedemptions.trim()) {
      toast({ title: "Enter max uses", variant: "destructive" });
      return;
    }

    const maxRedemptionsValue = parseInt(maxRedemptions);
    if (isNaN(maxRedemptionsValue) || maxRedemptionsValue <= 0) {
      toast({ title: "Invalid max uses", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    toast({ title: "Creating..." });
    
    try {
      const { data, error } = await supabase.rpc('admin_create_promo_code', {
        p_admin_id: user.id,
        p_code: promoCode.trim(),
        p_amount: amountValue,
        p_max_redemptions: maxRedemptionsValue,
        p_expires_at: expiryDate ? new Date(expiryDate).toISOString() : undefined
      });

      if (error) throw error;

      const result = data as { success: boolean; promo?: any; error?: string };
      
      if (result.success) {
        await fetchPromoCodes();
        setCreateDialogOpen(false);
        toast({ title: "Code created!" });
      } else {
        if (result.error?.includes("already exists")) {
          toast({ title: "Code exists", variant: "destructive" });
        } else {
          toast({ title: "Create failed", variant: "destructive" });
        }
      }
    } catch (error: any) {
      toast({ title: "Create failed", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeletePromo = async () => {
    if (!promoToDelete || !user?.id) return;

    setActionLoading(true);
    toast({ title: "Deleting..." });
    
    try {
      const { data, error } = await supabase.rpc('admin_delete_promo_code', {
        p_admin_id: user.id,
        p_promo_id: promoToDelete.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        setPromoCodes(prev => prev.filter(p => p.id !== promoToDelete.id));
        setDeleteDialogOpen(false);
        setPromoToDelete(null);
        toast({ title: "Deleted!" });
      } else {
        toast({ title: "Delete failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    toast({ title: "Refreshing..." });
    await fetchPromoCodes();
    toast({ title: "Refreshed!" });
    setRefreshing(false);
  };

  const totalCodes = promoCodes.length;
  const activeCodes = promoCodes.filter(p => p.is_active).length;
  const totalRedemptions = promoCodes.reduce((sum, p) => sum + p.current_redemptions, 0);
  const totalAmount = promoCodes.reduce((sum, p) => sum + (p.amount * p.current_redemptions), 0);

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
              Promotion Codes
            </h1>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              Generate promo codes for users to redeem
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin", isDark ? "text-gray-400" : "text-gray-600")} />
          </button>
          <Button
            onClick={handleCreatePromo}
            className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-4 h-4" />
            Generate Code
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Codes', value: totalCodes, icon: Ticket, color: 'violet' },
          { label: 'Active', value: activeCodes, icon: Sparkles, color: 'emerald' },
          { label: 'Redemptions', value: totalRedemptions, icon: Users, color: 'blue' },
          { label: 'Distributed', value: `₹${totalAmount.toLocaleString()}`, icon: IndianRupee, color: 'amber' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "p-5 rounded-2xl border transition-all",
              isDark 
                ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]" 
                : "bg-white border-gray-200 hover:shadow-md"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                stat.color === 'violet' && (isDark ? "bg-violet-500/20" : "bg-violet-100"),
                stat.color === 'emerald' && (isDark ? "bg-emerald-500/20" : "bg-emerald-100"),
                stat.color === 'blue' && (isDark ? "bg-blue-500/20" : "bg-blue-100"),
                stat.color === 'amber' && (isDark ? "bg-amber-500/20" : "bg-amber-100"),
              )}>
                <stat.icon className={cn(
                  "w-5 h-5",
                  stat.color === 'violet' && (isDark ? "text-violet-400" : "text-violet-600"),
                  stat.color === 'emerald' && (isDark ? "text-emerald-400" : "text-emerald-600"),
                  stat.color === 'blue' && (isDark ? "text-blue-400" : "text-blue-600"),
                  stat.color === 'amber' && (isDark ? "text-amber-400" : "text-amber-600"),
                )} />
              </div>
              <div>
                <p className={cn("text-xs font-medium", isDark ? "text-gray-500" : "text-gray-500")}>{stat.label}</p>
                <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Codes List */}
      <div className={cn(
        "rounded-2xl border overflow-hidden",
        isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200"
      )}>
        <div className={cn(
          "grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b",
          isDark ? "border-white/10 text-gray-500 bg-white/[0.02]" : "border-gray-100 text-gray-500 bg-gray-50"
        )}>
          <div className="col-span-3">Code</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Usage</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Expiry</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div>
          {loading ? (
            <div className="px-6 py-16 text-center">
              <RefreshCw className={cn("w-8 h-8 mx-auto mb-3 animate-spin", isDark ? "text-gray-600" : "text-gray-400")} />
              <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-500")}>Loading...</p>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                isDark ? "bg-white/5" : "bg-gray-100"
              )}>
                <Gift className={cn("w-8 h-8", isDark ? "text-gray-600" : "text-gray-400")} />
              </div>
              <p className={cn("font-medium mb-1", isDark ? "text-gray-400" : "text-gray-600")}>No promo codes yet</p>
              <p className={cn("text-sm", isDark ? "text-gray-600" : "text-gray-500")}>Generate your first code to get started</p>
            </div>
          ) : (
            promoCodes.map((promo) => {
              const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
              const usagePercent = (promo.current_redemptions / promo.max_redemptions) * 100;
              
              return (
                <div
                  key={promo.id}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors",
                    isDark 
                      ? "hover:bg-white/[0.02] border-b border-white/5 last:border-0" 
                      : "hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  )}
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold",
                      promo.is_active && !isExpired
                        ? isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"
                        : isDark ? "bg-gray-500/20 text-gray-500" : "bg-gray-100 text-gray-400"
                    )}>
                      {promo.code.slice(0, 2)}
                    </div>
                    <div>
                      <code className={cn(
                        "font-mono text-sm font-semibold",
                        isDark ? "text-white" : "text-gray-900"
                      )}>{promo.code}</code>
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className={cn(
                          "ml-2 p-1 rounded transition-colors",
                          isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                        )}
                      >
                        {copiedCode === promo.code 
                          ? <Check className="w-3 h-3 text-emerald-500" />
                          : <Copy className={cn("w-3 h-3", isDark ? "text-gray-500" : "text-gray-400")} />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className={cn(
                      "text-lg font-bold",
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    )}>₹{promo.amount}</span>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-1">
                      <span className={cn(
                        "text-sm",
                        promo.current_redemptions >= promo.max_redemptions
                          ? isDark ? "text-red-400" : "text-red-600"
                          : usagePercent >= 80
                            ? isDark ? "text-amber-400" : "text-amber-600"
                            : isDark ? "text-gray-300" : "text-gray-700"
                      )}>
                        {promo.current_redemptions}/{promo.max_redemptions}
                      </span>
                      <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            promo.current_redemptions >= promo.max_redemptions
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : usagePercent >= 80
                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                : "bg-gradient-to-r from-violet-500 to-indigo-500"
                          )}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <button
                      onClick={() => handleToggleActive(promo.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        promo.is_active && !isExpired
                          ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                          : isDark ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {promo.is_active && !isExpired ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {isExpired ? 'Expired' : promo.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="col-span-2">
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                      {promo.expires_at 
                        ? new Date(promo.expires_at).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDeletePromo(promo)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        isDark ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-gray-900 border-white/10" : "")}>
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              Generate Promo Code
            </DialogTitle>
            <DialogDescription>
              Create a new promotional code for users to redeem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : ""}>Promo Code (8-14 characters)</Label>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO2024"
                  maxLength={14}
                  inputSize="sm"
                  className={cn("font-mono uppercase h-10", isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateRandomCode}
                  className={cn("h-10 w-10", isDark ? "border-white/10 hover:bg-white/5" : "")}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? "text-gray-300" : ""}>Amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  inputSize="sm"
                  className={cn("h-10", isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200")}
                />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? "text-gray-300" : ""}>Max Uses</Label>
                <Input
                  type="number"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="100"
                  min="1"
                  inputSize="sm"
                  className={cn("h-10", isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={isDark ? "text-gray-300" : ""}>Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                inputSize="sm"
                className={cn("h-10", isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
              className={isDark ? "border-white/10 hover:bg-white/5" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCreatePromo}
              disabled={actionLoading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {actionLoading ? 'Creating...' : 'Create Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={cn("max-w-sm rounded-2xl", isDark ? "bg-gray-900 border-white/10" : "")}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : ""}>Delete Promo Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{promoToDelete?.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className={isDark ? "border-white/10 hover:bg-white/5" : ""}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePromo}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPromoCodes() {
  return (
    <AdminLayout title="Promotion Codes">
      <PromoCodesContent />
    </AdminLayout>
  );
}
