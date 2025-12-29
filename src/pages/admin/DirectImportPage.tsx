import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { directImportProviders } from '@/data/adminFolders';
import { cn } from '@/lib/utils';

function DirectImportContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/admin/services')}
        className={cn(
          "group flex items-center gap-2",
          isDark 
            ? "border-gray-700 text-gray-300 hover:bg-gray-800" 
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Services
      </Button>

      {/* Page Title */}
      <div>
        <h1 className={cn(
          "text-2xl font-bold",
          isDark ? "text-white" : "text-gray-900"
        )}>
          Direct Import
        </h1>
        <p className={cn(
          "text-sm mt-1",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          Select a provider to import services from
        </p>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {directImportProviders.map((provider) => {
          const Icon = provider.icon;
          
          return (
            <button
              key={provider.id}
              onClick={() => navigate(provider.path)}
              onMouseEnter={() => setHoveredFolder(provider.id)}
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
                  provider.gradient,
                  hoveredFolder === provider.id ? "opacity-5" : "opacity-0"
                )}
              />
              
              {/* Provider Icon */}
              <div className="relative z-10">
                <div 
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg bg-gradient-to-br transition-transform duration-200",
                    provider.gradient,
                    "group-hover:scale-105"
                  )}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Provider Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-semibold transition-colors text-sm sm:text-base",
                      "group-hover:text-primary",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {provider.title}
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
                    {provider.description}
                  </p>
                  {/* Import action */}
                  <div className="flex items-center gap-1.5 pt-1.5 sm:pt-2">
                    <FolderOpen className={cn(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )} />
                    <span className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      Import Services
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative corner */}
              <div 
                className={cn(
                  "absolute -bottom-4 -right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-full opacity-10 bg-gradient-to-br transition-transform duration-300",
                  provider.gradient,
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

export default function DirectImportPage() {
  return (
    <AdminLayout title="Direct Import">
      <DirectImportContent />
    </AdminLayout>
  );
}
