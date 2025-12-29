import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPermissions, getRoleInfo } from '@/hooks/useAdminPermissions';
import { useAdminStats } from '@/hooks/useAdminStats';
import { adminFolders, FolderItem } from '@/data/adminFolders';
import { 
  Users, Shield, Server, BarChart3, Package, Search, Palette,
  CreditCard, Bell, FileText, Settings, Clock, LogOut,
  FolderOpen, ChevronRight, Sparkles, RefreshCw, Lock, Crown, Check, X, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

// Permission features list
const allPermissionFeatures = [
  { key: 'canManageUsers', label: 'Manage Users', description: 'View, search and manage all users', icon: Users },
  { key: 'canBanUsers', label: 'Ban/Unban Users', description: 'Block or unblock user accounts', icon: Shield },
  { key: 'canResetPasswords', label: 'Reset Passwords', description: 'Reset user account passwords', icon: Lock },
  { key: 'canEditBalance', label: 'Edit Balance', description: 'Credit or debit user wallets', icon: CreditCard },
  { key: 'canManageAdmins', label: 'Manage Admins', description: 'Add, remove and change admin roles', icon: Crown },
  { key: 'canEditServices', label: 'Manage Services', description: 'Add, edit and configure services', icon: Server },
  { key: 'canViewAnalytics', label: 'View Analytics', description: 'Access revenue and performance reports', icon: BarChart3 },
  { key: 'canManageSEO', label: 'Manage SEO', description: 'Configure meta tags and sitemap', icon: Search },
  { key: 'canManageTheme', label: 'Manage Theme', description: 'Customize colors and typography', icon: Palette },
  { key: 'canManagePayments', label: 'Payment Settings', description: 'Configure payment gateways', icon: CreditCard },
  { key: 'canManageSettings', label: 'System Settings', description: 'Configure login and security options', icon: Settings },
  { key: 'canManageNumberWaiting', label: 'Number Waiting', description: 'Handle pending number requests', icon: Clock },
  { key: 'canManageNotifications', label: 'Notifications', description: 'Send and manage notifications', icon: Bell },
  { key: 'canManageFooter', label: 'Website Footer', description: 'Edit footer links and content', icon: FileText },
  { key: 'canManageReadymade', label: 'Readymade Accounts', description: 'Manage pre-configured accounts', icon: Package },
  { key: 'canLoginAsUser', label: 'Login as User', description: 'Access user accounts for support', icon: Users },
];

function DashboardContent() {
  const navigate = useNavigate();
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [adminCounts, setAdminCounts] = useState<{owner: number; manager: number; handler: number; admin: number; moderator: number} | null>(null);
  const [loadingAdminCounts, setLoadingAdminCounts] = useState(false);
  const { resolvedTheme } = useAdminTheme();
  const { user } = useAuth();
  const permissions = useAdminPermissions(user?.id || null);
  
  const { stats, loading: statsLoading, refetch } = useAdminStats();
  const isDark = resolvedTheme === 'dark';
  const roleInfo = getRoleInfo(permissions.role);

  const fetchAdminCounts = async () => {
    setLoadingAdminCounts(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_counts_by_role');
      if (!error && data) {
        setAdminCounts(data as {owner: number; manager: number; handler: number; admin: number; moderator: number});
      }
    } catch (err) {
      console.error('Error fetching admin counts:', err);
    } finally {
      setLoadingAdminCounts(false);
    }
  };

  // Check if user has access to a folder based on their level
  const hasAccess = (requiredLevel: number) => permissions.level >= requiredLevel;

  const handleFolderClick = (folder: FolderItem) => {
    if (!hasAccess(folder.requiredLevel)) {
      // Don't navigate if no access
      return;
    }
    navigate(folder.path);
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 3: return 'Owner Only';
      case 2: return 'Manager+';
      default: return '';
    }
  };

  // Get enabled and disabled permissions
  const enabledFeatures = allPermissionFeatures.filter(f => permissions[f.key as keyof typeof permissions]);
  const disabledFeatures = allPermissionFeatures.filter(f => !permissions[f.key as keyof typeof permissions]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome to Admin Console</h1>
            </div>
            <button 
              onClick={refetch}
              className={cn(
                "p-2 rounded-lg bg-white/10 transition-all duration-300",
                statsLoading && "bg-white/20"
              )}
              title="Refresh stats"
              disabled={statsLoading}
            >
              <RefreshCw className={cn(
                "w-5 h-5 transition-transform",
                statsLoading && "animate-spin"
              )} />
            </button>
          </div>
          <p className="text-white/80 max-w-xl text-sm sm:text-base">
            Manage your platform settings, users, services, and more. Click on any folder to open its settings.
          </p>
          {/* Real-time stats bar */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            >
              <span className="opacity-70">Total Users:</span> <span className="font-semibold">{stats.totalUsers}</span>
            </button>
            <Popover onOpenChange={(open) => open && fetchAdminCounts()}>
              <PopoverTrigger asChild>
                <button className="bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1">
                  <span className="opacity-70">Total Admins:</span> 
                  <span className="font-semibold">{stats.totalAdmins}</span>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className={cn(
                "w-auto p-3",
                isDark ? "bg-gray-900 border-gray-700" : ""
              )}>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Admin Breakdown</div>
                  {loadingAdminCounts ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : adminCounts ? (
                    <div className="space-y-1.5">
                      {adminCounts.owner > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Owner</span>
                          </div>
                          <span className="font-semibold">{adminCounts.owner}</span>
                        </div>
                      )}
                      {adminCounts.manager > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>Manager</span>
                          </div>
                          <span className="font-semibold">{adminCounts.manager}</span>
                        </div>
                      )}
                      {adminCounts.handler > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Handler</span>
                          </div>
                          <span className="font-semibold">{adminCounts.handler}</span>
                        </div>
                      )}
                      {adminCounts.admin > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Admin</span>
                          </div>
                          <span className="font-semibold">{adminCounts.admin}</span>
                        </div>
                      )}
                      {adminCounts.moderator > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                            <span>Moderator</span>
                          </div>
                          <span className="font-semibold">{adminCounts.moderator}</span>
                        </div>
                      )}
                      {Object.values(adminCounts).every(v => v === 0) && (
                        <div className="text-sm text-muted-foreground">No admins found</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="opacity-70">Total Referrals:</span> <span className="font-semibold">{stats.totalReferrals}</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="opacity-70">Total Balance:</span> <span className="font-semibold">₹{stats.totalBalance.toLocaleString()}</span>
            </div>
            {/* Role & Permissions Badge */}
            <button
              onClick={() => setPermissionsDialogOpen(true)}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300 group"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-amber-100">{roleInfo.label}</span>
              <Zap className="w-3 h-3 text-amber-400 group-hover:animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[85vh] overflow-hidden",
          isDark ? "bg-gray-900 border-gray-700" : ""
        )}>
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                roleInfo.color
              )}>
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Your Permissions</span>
                <div className={cn(
                  "text-sm font-medium mt-0.5",
                  roleInfo.textColor
                )}>
                  {roleInfo.label} • Level {permissions.level}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-6 pr-2">
            {/* Enabled Features */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <h3 className={cn(
                  "font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Available Functions ({enabledFeatures.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enabledFeatures.map((feature) => (
                  <div
                    key={feature.key}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isDark 
                        ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10" 
                        : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className={cn(
                        "font-medium text-sm truncate",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {feature.label}
                      </div>
                      <div className={cn(
                        "text-xs truncate",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disabled Features */}
            {disabledFeatures.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <h3 className={cn(
                    "font-semibold",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    Requires Higher Role ({disabledFeatures.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {disabledFeatures.map((feature) => (
                    <div
                      key={feature.key}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border opacity-50",
                        isDark 
                          ? "bg-gray-800/50 border-gray-700" 
                          : "bg-gray-100 border-gray-200"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className={cn(
                          "font-medium text-sm truncate",
                          isDark ? "text-gray-400" : "text-gray-600"
                        )}>
                          {feature.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {feature.description}
                        </div>
                      </div>
                      <Lock className="w-3.5 h-3.5 text-gray-500 ml-auto flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cn(
            "pt-4 mt-4 border-t flex items-center justify-between",
            isDark ? "border-gray-700" : "border-gray-200"
          )}>
            <div className={cn(
              "text-xs",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>
              Contact owner to upgrade your role
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className={cn(
                "font-medium",
                isDark ? "text-amber-400" : "text-amber-600"
              )}>
                {enabledFeatures.length}/{allPermissionFeatures.length} Features Unlocked
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {adminFolders.map((folder) => {
          const canAccess = hasAccess(folder.requiredLevel);
          const isLocked = !canAccess;
          
          return (
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              onMouseEnter={() => setHoveredFolder(folder.id)}
              onMouseLeave={() => setHoveredFolder(null)}
              disabled={isLocked}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "min-h-[160px] sm:min-h-[180px]", // Fixed height for consistency
                isLocked 
                  ? "cursor-not-allowed opacity-60" 
                  : "hover:shadow-2xl hover:-translate-y-1",
                isDark 
                  ? cn(
                      "bg-gray-900 border border-gray-700",
                      !isLocked && "hover:border-primary/30 hover:shadow-primary/10"
                    )
                  : cn(
                      "bg-white border border-gray-200",
                      !isLocked && "hover:border-primary/30 hover:shadow-gray-200"
                    )
              )}
            >
              {/* Locked overlay with blur */}
              {isLocked && (
                <div className="absolute inset-0 z-20 backdrop-blur-[2px] bg-black/10 rounded-2xl flex items-center justify-center">
                  <div className={cn(
                    "px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium",
                    isDark 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  )}>
                    <Lock className="w-3 h-3" />
                    {getLevelLabel(folder.requiredLevel)}
                  </div>
                </div>
              )}

              {/* Background gradient on hover */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-opacity duration-200",
                  folder.gradient,
                  hoveredFolder === folder.id && !isLocked ? "opacity-5" : "opacity-0"
                )}
              />
              
              {/* Folder Icon */}
              <div className="relative z-10">
                <div 
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg bg-gradient-to-br transition-transform duration-200",
                    folder.gradient,
                    !isLocked && "group-hover:scale-105"
                  )}
                >
                  <folder.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Folder Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-semibold transition-colors text-sm sm:text-base",
                      !isLocked && "group-hover:text-primary",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {folder.title}
                    </h3>
                    {isLocked ? (
                      <Lock className={cn(
                        "w-4 h-4",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )} />
                    ) : (
                      <ChevronRight className={cn(
                        "w-4 h-4 group-hover:text-primary transition-transform duration-200 group-hover:translate-x-1",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )} />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs sm:text-sm line-clamp-2",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {folder.description}
                  </p>
                  {folder.items !== undefined && (
                    <div className="flex items-center gap-1.5 pt-1.5 sm:pt-2">
                      <FolderOpen className={cn(
                        "w-3 h-3 sm:w-3.5 sm:h-3.5",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )} />
                      <span className={cn(
                        "text-xs",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        {folder.items.toLocaleString()} items
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative corner */}
              <div 
                className={cn(
                  "absolute -bottom-4 -right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-full opacity-10 bg-gradient-to-br transition-transform duration-300",
                  folder.gradient,
                  !isLocked && "group-hover:scale-150"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Exit Admin */}
      <button
        onClick={() => navigate('/')}
        className={cn(
          "w-full max-w-sm mx-auto flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg",
          isDark 
            ? "bg-indigo-950/30 border-indigo-900/50 text-indigo-400 hover:bg-indigo-950/50" 
            : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
        )}
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Exit Admin Panel</span>
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout title="Admin Console">
      <DashboardContent />
    </AdminLayout>
  );
}
