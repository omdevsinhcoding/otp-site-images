import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Shield, Sun, Moon, Monitor, LogOut, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { adminFolders, FolderItem } from '@/data/adminFolders';

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title = 'Dashboard' }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useAdminTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isDark = resolvedTheme === 'dark';

  // Filter and sort folders based on search query
  const filteredFolders = searchQuery.trim()
    ? adminFolders
        .filter(folder => {
          const query = searchQuery.toLowerCase();
          return (
            folder.title.toLowerCase().includes(query) ||
            folder.description.toLowerCase().includes(query) ||
            folder.id.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => {
          const query = searchQuery.toLowerCase();
          const aStartsWith = a.title.toLowerCase().startsWith(query);
          const bStartsWith = b.title.toLowerCase().startsWith(query);
          
          // Prioritize folders that start with the query
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return 0;
        })
    : [];

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFolderClick = (folder: FolderItem) => {
    navigate(folder.path);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 backdrop-blur border-b transition-colors duration-300",
      isDark 
        ? "bg-[hsl(222.2,84%,4.9%)]/95 border-[hsl(217.2,32.6%,17.5%)]" 
        : "bg-white/95 border-[hsl(214.3,31.8%,91.4%)]"
    )}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left side - Logo & Title */}
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/admin')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>Admin Panel</h1>
              <p className={cn(
                "text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>{title}</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search with Dropdown */}
          <div className="hidden md:flex relative" ref={searchRef}>
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10",
              isDark ? "text-gray-400" : "text-gray-500"
            )} />
            <Input
              placeholder="Search folders..."
              value={searchQuery}
              inputSize="sm"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              className={cn(
                "w-48 lg:w-64 pl-9",
                isDark 
                  ? "bg-white/10 text-white placeholder:text-gray-400 hover:bg-white/15 focus-visible:ring-indigo-500/50" 
                  : "bg-gray-100 text-gray-900 placeholder:text-gray-500 hover:bg-gray-200 focus-visible:ring-indigo-500/50"
              )}
            />
            
            {/* Search Results Dropdown */}
            {isSearchOpen && filteredFolders.length > 0 && (
              <div className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl border overflow-hidden z-50",
                isDark 
                  ? "bg-gray-900 border-gray-700" 
                  : "bg-white border-gray-200"
              )}>
                <div className="max-h-80 overflow-y-auto">
                  {filteredFolders.map((folder) => {
                    const IconComponent = folder.icon;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderClick(folder)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                          isDark 
                            ? "hover:bg-gray-800" 
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                          folder.gradient
                        )}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-medium text-sm",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            {folder.title}
                          </div>
                          <div className={cn(
                            "text-xs truncate",
                            isDark ? "text-gray-400" : "text-gray-500"
                          )}>
                            {folder.description}
                          </div>
                        </div>
                        <FolderOpen className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isDark ? "text-gray-500" : "text-gray-400"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {isSearchOpen && searchQuery.trim() && filteredFolders.length === 0 && (
              <div className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl border p-4 z-50",
                isDark 
                  ? "bg-gray-900 border-gray-700" 
                  : "bg-white border-gray-200"
              )}>
                <div className={cn(
                  "text-sm text-center",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  No folders found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative",
                  isDark ? "text-gray-300 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Sun className={cn(
                  "w-5 h-5 transition-all",
                  isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
                )} />
                <Moon className={cn(
                  "absolute w-5 h-5 transition-all",
                  isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
                )} />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn(
              "z-50",
              isDark 
                ? "bg-gray-900 border-gray-700 text-gray-100" 
                : "bg-white border-gray-200 text-gray-900"
            )}>
              <DropdownMenuItem 
                onClick={() => setTheme('light')}
                className={cn(
                  "cursor-pointer",
                  theme === 'light' && (isDark ? "bg-gray-800" : "bg-gray-100"),
                  isDark 
                    ? "text-gray-100 hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white" 
                    : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                )}
              >
                <Sun className="w-4 h-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('dark')}
                className={cn(
                  "cursor-pointer",
                  theme === 'dark' && (isDark ? "bg-gray-800" : "bg-gray-100"),
                  isDark 
                    ? "text-gray-100 hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white" 
                    : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                )}
              >
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('system')}
                className={cn(
                  "cursor-pointer",
                  theme === 'system' && (isDark ? "bg-gray-800" : "bg-gray-100"),
                  isDark 
                    ? "text-gray-100 hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white" 
                    : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                )}
              >
                <Monitor className="w-4 h-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "relative",
              isDark ? "text-gray-300 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "gap-2 pl-2 pr-2 sm:pr-3",
                  isDark ? "text-gray-300 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                    {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "hidden sm:inline text-sm font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {user?.name || 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn(
              "w-56 z-50",
              isDark 
                ? "bg-gray-900 border-gray-700 text-gray-100" 
                : "bg-white border-gray-200 text-gray-900"
            )}>
              <DropdownMenuLabel className={isDark ? "text-gray-300" : "text-gray-700"}>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className={isDark ? "bg-gray-700" : "bg-gray-200"} />
              <DropdownMenuItem className={cn(
                "cursor-pointer",
                isDark 
                  ? "text-gray-100 hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white" 
                  : "text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
              )}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={cn(
                  "cursor-pointer font-medium",
                  "text-red-500 hover:text-red-400 focus:text-red-400",
                  isDark 
                    ? "hover:bg-red-950/50 focus:bg-red-950/50" 
                    : "hover:bg-red-50 focus:bg-red-50"
                )}
                onClick={() => navigate('/')}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Exit Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
