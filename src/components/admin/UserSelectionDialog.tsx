import { useState, useEffect, useMemo } from 'react';
import { Search, User, Loader2, Check, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAdminTheme } from '@/hooks/useAdminTheme';

interface UserData {
  id: string;
  uid: string;
  email: string;
  name: string | null;
}

interface UserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserData[];
  loading?: boolean;
  selectedUserId: string;
  onSelect: (userId: string) => void;
  title?: string;
  description?: string;
  existingAdminIds?: string[];
}

export function UserSelectionDialog({
  open,
  onOpenChange,
  users,
  loading = false,
  selectedUserId,
  onSelect,
  title = "Select User",
  description = "Search and select a user from the list below.",
  existingAdminIds = []
}: UserSelectionDialogProps) {
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
    }
  }, [open]);

  // Filter users based on search only (show all users)
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.uid.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [users, searchQuery]);

  // Check if user is existing admin
  const isExistingAdmin = (userId: string) => existingAdminIds.includes(userId);

  const handleSelect = (userId: string) => {
    onSelect(userId);
    onOpenChange(false);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden",
        isDark ? "bg-gray-900 border-gray-800" : ""
      )}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              isDark ? "text-gray-500" : "text-gray-400"
            )} />
            <Input
              placeholder="Search by email, UID, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10",
                isDark ? "bg-gray-800 border-gray-700" : ""
              )}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className={cn(
          "border-t border-b",
          isDark ? "border-gray-800" : "border-gray-200"
        )}>
          <ScrollArea className="h-[320px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  Loading users...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] gap-3">
                <User className={cn("w-12 h-12 opacity-30", isDark ? "text-gray-600" : "text-gray-400")} />
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  {users.length === 0 
                    ? "No users found in database" 
                    : searchQuery 
                      ? "No users match your search"
                      : "All users are already selected"
                  }
                </p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-indigo-500"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredUsers.map((user) => {
                  const isSelected = user.id === selectedUserId;
                  const isAdmin = isExistingAdmin(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelect(user.id)}
                      className={cn(
                        "w-full px-6 py-3 flex items-center gap-4 text-left transition-colors",
                        isSelected 
                          ? isDark 
                            ? "bg-indigo-500/20" 
                            : "bg-indigo-50"
                          : isDark 
                            ? "hover:bg-gray-800" 
                            : "hover:bg-gray-50"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0",
                        isSelected
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                          : isAdmin
                            ? "bg-gradient-to-br from-amber-500 to-orange-600"
                            : isDark 
                              ? "bg-gray-700" 
                              : "bg-gray-300"
                      )}>
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium truncate",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            {user.name || user.email.split('@')[0]}
                          </p>
                          {isAdmin && (
                            <Badge variant="outline" className="shrink-0 text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm truncate",
                          isDark ? "text-gray-400" : "text-gray-500"
                        )}>
                          {user.email}
                        </p>
                        <p className={cn(
                          "text-xs font-mono",
                          isDark ? "text-gray-500" : "text-gray-400"
                        )}>
                          {user.uid}
                        </p>
                      </div>
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer with count */}
        <div className={cn(
          "px-6 py-4 flex items-center justify-between",
          isDark ? "bg-gray-800/50" : "bg-gray-50"
        )}>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {loading ? 'Loading...' : `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} found`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
