import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, FolderOpen, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { serviceSubFolders } from '@/data/adminFolders';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

function ServicesContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [showOperator, setShowOperator] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current setting
  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase.rpc('get_app_setting', { p_setting_key: 'show_operator_in_get_number' });
      if (data !== null) {
        setShowOperator(data === true || data === 'true');
      }
    };
    fetchSetting();
  }, []);

  const handleToggleOperator = async () => {
    const storedUser = localStorage.getItem('custom_auth_user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData?.id;
    
    if (!userId) {
      toast({ title: 'Error', description: 'User not logged in', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    try {
      const newValue = !showOperator;
      console.log('Calling update_app_setting with:', { userId, newValue });
      
      const { data, error } = await supabase.rpc('update_app_setting', {
        p_user_id: userId,
        p_setting_key: 'show_operator_in_get_number',
        p_setting_value: newValue
      });

      console.log('RPC result:', { data, error });

      if (error) throw error;
      const result = data as { success: boolean; error?: string } | null;
      if (result && !result.success) throw new Error(result.error);

      setShowOperator(newValue);
      toast({
        title: newValue ? 'Operator visible' : 'Operator hidden',
        description: `Operator name is now ${newValue ? 'shown' : 'hidden'} in Get Number page`,
      });
    } catch (err: any) {
      console.error('Toggle error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/admin')}
        className={cn(
          "group flex items-center gap-2",
          isDark 
            ? "border-gray-700 text-gray-300 hover:bg-gray-800" 
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Admin Console
      </Button>

      {/* Page Title */}
      <div>
        <h1 className={cn(
          "text-2xl font-bold",
          isDark ? "text-white" : "text-gray-900"
        )}>
          Services
        </h1>
        <p className={cn(
          "text-sm mt-1",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          Manage servers, services, and imports
        </p>
      </div>

      {/* Settings Card */}
      <div className={cn(
        "rounded-xl p-4 border",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        <h2 className={cn(
          "text-sm font-semibold mb-3",
          isDark ? "text-gray-200" : "text-gray-800"
        )}>
          Display Settings
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showOperator ? (
              <Eye className={cn("w-5 h-5", isDark ? "text-emerald-400" : "text-emerald-600")} />
            ) : (
              <EyeOff className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
            )}
            <div>
              <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                Show Operator Name
              </p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                Display operator info in server selection on Get Number page
              </p>
            </div>
          </div>
          <Switch
            checked={showOperator}
            onCheckedChange={handleToggleOperator}
            disabled={isUpdating}
          />
        </div>
      </div>

      {/* Folder Cards Grid - Same style as AdminDashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {serviceSubFolders.map((folder) => {
          const Icon = folder.icon;
          
          return (
            <button
              key={folder.id}
              onClick={() => navigate(folder.path)}
              onMouseEnter={() => setHoveredFolder(folder.id)}
              onMouseLeave={() => setHoveredFolder(null)}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "min-h-[160px] sm:min-h-[180px]",
                "hover:shadow-2xl hover:-translate-y-1",
                isDark 
                  ? "bg-gray-900 border border-gray-700 hover:border-primary/30 hover:shadow-primary/10"
                  : "bg-white border border-gray-200 hover:border-primary/30 hover:shadow-gray-200"
              )}
            >
              {/* Background gradient on hover */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-opacity duration-200",
                  folder.gradient,
                  hoveredFolder === folder.id ? "opacity-5" : "opacity-0"
                )}
              />
              
              {/* Folder Icon */}
              <div className="relative z-10">
                <div 
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg bg-gradient-to-br transition-transform duration-200",
                    folder.gradient,
                    "group-hover:scale-105"
                  )}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Folder Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-semibold transition-colors text-sm sm:text-base",
                      "group-hover:text-primary",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {folder.title}
                    </h3>
                    <ChevronRight className={cn(
                      "w-4 h-4 group-hover:text-primary transition-transform duration-200 group-hover:translate-x-1",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )} />
                  </div>
                  <p className={cn(
                    "text-xs sm:text-sm line-clamp-2",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {folder.description}
                  </p>
                  {/* Items count placeholder */}
                  <div className="flex items-center gap-1.5 pt-1.5 sm:pt-2">
                    <FolderOpen className={cn(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )} />
                    <span className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      Manage
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative corner */}
              <div 
                className={cn(
                  "absolute -bottom-4 -right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-full opacity-10 bg-gradient-to-br transition-transform duration-300",
                  folder.gradient,
                  "group-hover:scale-150"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminServices() {
  return (
    <AdminLayout title="Services Management">
      <ServicesContent />
    </AdminLayout>
  );
}
