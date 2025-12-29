import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { paymentSubFolders, ServiceSubFolder } from '@/data/adminFolders';
import { ArrowLeft, FolderOpen, ChevronRight, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

function AdminPaymentsContent() {
  const navigate = useNavigate();
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  const handleFolderClick = (folder: ServiceSubFolder) => {
    navigate(folder.path);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin')}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
          )}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Settings</h1>
            <p className="text-muted-foreground text-sm">Configure payment gateways and options</p>
          </div>
        </div>
      </div>

      {/* Sub-folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentSubFolders.map((folder) => {
          const IconComponent = folder.icon;
          const isHovered = hoveredFolder === folder.id;
          
          return (
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              onMouseEnter={() => setHoveredFolder(folder.id)}
              onMouseLeave={() => setHoveredFolder(null)}
              className={cn(
                "relative group p-5 rounded-2xl border text-left transition-all duration-300",
                "hover:shadow-lg hover:scale-[1.02]",
                isDark 
                  ? "bg-gray-900/50 border-gray-700 hover:border-gray-600" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
            >
              {/* Gradient overlay on hover */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                  "bg-gradient-to-br",
                  folder.gradient,
                  isHovered && "opacity-5"
                )}
              />
              
              <div className="relative z-10 flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform duration-300",
                  folder.gradient,
                  isHovered && "scale-110"
                )}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "font-semibold truncate",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {folder.title}
                    </h3>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      isDark ? "text-gray-500" : "text-gray-400",
                      isHovered && "translate-x-1"
                    )} />
                  </div>
                  <p className={cn(
                    "text-sm mt-1 line-clamp-2",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {folder.description}
                  </p>
                </div>
              </div>

              {/* Folder icon indicator */}
              <div className={cn(
                "absolute bottom-3 right-3 opacity-0 transition-opacity duration-300",
                isHovered && "opacity-100"
              )}>
                <FolderOpen className={cn(
                  "w-5 h-5",
                  isDark ? "text-gray-600" : "text-gray-300"
                )} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPayments() {
  return (
    <AdminLayout>
      <AdminPaymentsContent />
    </AdminLayout>
  );
}
