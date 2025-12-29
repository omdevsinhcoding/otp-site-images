import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { 
  Users, Ban, ChevronRight, FolderOpen, ArrowLeft, Percent, Ticket, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
  items?: number;
}

const userFolders: FolderItem[] = [
  {
    id: 'all-users',
    title: 'All Users',
    description: 'View and manage all registered users',
    icon: Users,
    path: '/admin/users/all',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'banned-users',
    title: 'Banned Users',
    description: 'Suspended and banned user accounts',
    icon: Ban,
    path: '/admin/users/banned',
    gradient: 'from-red-500 to-rose-500',
  },
  {
    id: 'discount-setup',
    title: 'Discount Setup',
    description: 'Set individual user discounts',
    icon: Percent,
    path: '/admin/discount-setup',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'promo-codes',
    title: 'Promotion Codes',
    description: 'Generate & manage promo codes',
    icon: Ticket,
    path: '/admin/promo-codes',
    gradient: 'from-violet-500 to-indigo-500',
  },
  {
    id: 'toast-settings',
    title: 'Toast Settings',
    description: 'Enable or disable toast animations',
    icon: Bell,
    path: '/admin/toast-settings',
    gradient: 'from-amber-500 to-orange-500',
  },
];

function UsersContent() {
  const navigate = useNavigate();
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  const handleFolderClick = (folder: FolderItem) => {
    navigate(folder.path);
  };

  return (
    <div className="space-y-8">
      {/* Back Button - Premium Style */}
      <button
        onClick={() => navigate('/admin')}
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
          isDark 
            ? "bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50 hover:border-gray-600 shadow-lg shadow-black/20" 
            : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-lg shadow-gray-200/50 hover:shadow-xl"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Admin Console
      </button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-2xl sm:text-3xl font-bold">Users Management</h1>
          </div>
          <p className="text-white/80 max-w-xl text-sm sm:text-base">
            Manage all users, view online status, and handle banned accounts.
          </p>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {userFolders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleFolderClick(folder)}
            onMouseEnter={() => setHoveredFolder(folder.id)}
            onMouseLeave={() => setHoveredFolder(null)}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all duration-300",
              "hover:shadow-2xl hover:-translate-y-1",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
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
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg bg-gradient-to-br transition-transform duration-200 group-hover:scale-105",
                  folder.gradient
                )}
              >
                <folder.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              {/* Folder Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "font-semibold group-hover:text-primary transition-colors text-sm sm:text-base",
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
                "absolute -bottom-4 -right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-full opacity-10 bg-gradient-to-br transition-transform duration-300 group-hover:scale-150",
                folder.gradient
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  return (
    <AdminLayout title="Users Management">
      <UsersContent />
    </AdminLayout>
  );
}
