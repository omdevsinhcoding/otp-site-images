import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, Server, Save, Loader2, Search, Trash2, AlertTriangle, Key, Globe, Link2, Settings2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ServerOption {
  id: string;
  server_name: string;
  country_name: string;
  country_flag: string | null;
  is_active: boolean;
  source_table: 'sms_servers' | 'auto_sms_servers';
}

interface FullServerData {
  id: string;
  server_name: string;
  country_name: string;
  country_code: string;
  country_dial_code: string;
  country_flag: string | null;
  is_active: boolean;
  api_get_number_url: string;
  api_get_message_url: string | null;
  api_cancel_number_url: string | null;
  api_activate_next_message_url: string | null;
  api_response_type: string;
  uses_headers: boolean;
  header_key_name: string | null;
  header_value: string | null;
  number_id_path: string | null;
  phone_number_path: string | null;
  otp_path_in_json: string | null;
  auto_cancel_minutes: number;
  api_retry_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  // auto_sms_servers specific
  api_key?: string;
  provider?: string;
  source_table: 'sms_servers' | 'auto_sms_servers';
}

function ShowAllServersContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [selectedServer, setSelectedServer] = useState<FullServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getUserId = () => {
    const storedUser = localStorage.getItem('custom_auth_user');
    return storedUser ? JSON.parse(storedUser)?.id : null;
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      // Use secure RPC function
      const { data, error } = await supabase.rpc('admin_list_servers', {
        p_admin_id: userId
      });

      if (error) throw error;
      
      const result = data as unknown as { success: boolean; servers?: ServerOption[]; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch servers');
      }

      setServers(result.servers || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectServer = async (server: ServerOption) => {
    setLoadingDetails(true);
    try {
      const userId = getUserId();
      if (!userId) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      // Use secure RPC function to get full server details
      const { data, error } = await supabase.rpc('admin_get_server_details', {
        p_admin_id: userId,
        p_server_id: server.id,
        p_source_table: server.source_table
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; server?: FullServerData; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch server details');
      }

      setSelectedServer(result.server || null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFieldChange = (field: keyof FullServerData, value: any) => {
    if (!selectedServer) return;
    setSelectedServer(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!selectedServer) return;
    
    setSaving(true);
    try {
      const userId = getUserId();
      if (!userId) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      const { source_table, created_at, updated_at, created_by, ...updateData } = selectedServer;
      
      // Use secure RPC function to update
      const { data, error } = await supabase.rpc('admin_update_server', {
        p_admin_id: userId,
        p_server_id: selectedServer.id,
        p_source_table: source_table,
        p_server_data: updateData
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update server');
      }

      // Update the server list
      setServers(prev => prev.map(s => 
        s.id === selectedServer.id 
          ? { ...s, server_name: selectedServer.server_name, country_name: selectedServer.country_name, country_flag: selectedServer.country_flag, is_active: selectedServer.is_active }
          : s
      ));

      toast({ title: 'Success', description: 'Server updated successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedServer) return;
    
    setDeleting(true);
    try {
      const userId = getUserId();
      if (!userId) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      // Use secure RPC function to delete
      const { data, error } = await supabase.rpc('admin_delete_server', {
        p_admin_id: userId,
        p_server_id: selectedServer.id,
        p_source_table: selectedServer.source_table
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete server');
      }

      setServers(prev => prev.filter(s => s.id !== selectedServer.id));
      setSelectedServer(null);
      setDeleteDialogOpen(false);
      toast({ title: 'Deleted', description: 'Server deleted successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredServers = servers.filter(s => 
    s.server_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Server Selection View
  if (!selectedServer) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/services')}
          className={cn(
            "group flex items-center gap-2",
            isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Services
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              Select Server to Edit
            </h1>
            <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
              Choose a server to view and edit all its information ({servers.length} total)
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9", isDark ? "bg-gray-800 border-gray-700" : "bg-white")}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredServers.length === 0 ? (
          <div className={cn(
            "text-center py-12 rounded-xl border",
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          )}>
            <Server className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-400")} />
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>No servers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((server) => (
              <button
                key={server.id}
                onClick={() => handleSelectServer(server)}
                disabled={loadingDetails}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all duration-200",
                  "hover:shadow-lg hover:-translate-y-0.5",
                  isDark 
                    ? "bg-gray-900 border-gray-700 hover:border-primary/50" 
                    : "bg-white border-gray-200 hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{server.country_flag || '🌍'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>
                      {server.server_name}
                    </h3>
                    <p className={cn("text-sm truncate", isDark ? "text-gray-400" : "text-gray-500")}>
                      {server.country_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        server.is_active 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-red-500/20 text-red-500"
                      )}>
                        {server.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                        {server.source_table === 'auto_sms_servers' ? 'Auto' : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {loadingDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={cn("p-6 rounded-xl", isDark ? "bg-gray-900" : "bg-white")}>
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className={cn("mt-3 text-sm", isDark ? "text-gray-400" : "text-gray-600")}>Loading server details...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Server Edit View - Show ALL fields
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={() => setSelectedServer(null)}
          className={cn(
            "group flex items-center gap-2",
            isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Server List
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete Server
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-4xl">{selectedServer.country_flag || '🌍'}</span>
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            {selectedServer.server_name}
          </h1>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {selectedServer.source_table === 'auto_sms_servers' ? 'Auto Import Server' : 'Manual Server'} • ID: {selectedServer.id}
          </p>
        </div>
      </div>

      <div className={cn("rounded-xl border p-6 space-y-8", isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200")}>
        {/* Basic Info */}
        <SectionCard title="Basic Information" icon={<Globe className="w-5 h-5" />} isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldInput label="Server Name" value={selectedServer.server_name} onChange={(v) => handleFieldChange('server_name', v)} isDark={isDark} />
            <FieldInput label="Country Name" value={selectedServer.country_name} onChange={(v) => handleFieldChange('country_name', v)} isDark={isDark} />
            <FieldInput label="Country Code" value={selectedServer.country_code} onChange={(v) => handleFieldChange('country_code', v)} isDark={isDark} />
            <FieldInput label="Country Dial Code" value={selectedServer.country_dial_code} onChange={(v) => handleFieldChange('country_dial_code', v)} isDark={isDark} />
            <FieldInput label="Country Flag (emoji)" value={selectedServer.country_flag || ''} onChange={(v) => handleFieldChange('country_flag', v)} isDark={isDark} />
            <div>
              <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Active Status</label>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={selectedServer.is_active} onCheckedChange={(v) => handleFieldChange('is_active', v)} />
                <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>{selectedServer.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* API Configuration */}
        <SectionCard title="API Endpoints" icon={<Link2 className="w-5 h-5" />} isDark={isDark}>
          <div className="space-y-4">
            <FieldInput label="API Get Number URL" value={selectedServer.api_get_number_url} onChange={(v) => handleFieldChange('api_get_number_url', v)} isDark={isDark} mono />
            <FieldInput label="API Get Message URL" value={selectedServer.api_get_message_url || ''} onChange={(v) => handleFieldChange('api_get_message_url', v)} isDark={isDark} mono />
            <FieldInput label="API Cancel Number URL" value={selectedServer.api_cancel_number_url || ''} onChange={(v) => handleFieldChange('api_cancel_number_url', v)} isDark={isDark} mono />
            <FieldInput label="API Activate Next Message URL" value={selectedServer.api_activate_next_message_url || ''} onChange={(v) => handleFieldChange('api_activate_next_message_url', v)} isDark={isDark} mono />
          </div>
        </SectionCard>

        {/* API Settings */}
        <SectionCard title="API Settings" icon={<Settings2 className="w-5 h-5" />} isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldInput label="API Response Type" value={selectedServer.api_response_type} onChange={(v) => handleFieldChange('api_response_type', v)} isDark={isDark} />
            <FieldInput label="Auto Cancel Minutes" type="number" value={selectedServer.auto_cancel_minutes} onChange={(v) => handleFieldChange('auto_cancel_minutes', parseInt(v) || 0)} isDark={isDark} />
            <FieldInput label="API Retry Count" type="number" value={selectedServer.api_retry_count} onChange={(v) => handleFieldChange('api_retry_count', parseInt(v) || 0)} isDark={isDark} />
          </div>
        </SectionCard>

        {/* Headers Configuration */}
        <SectionCard title="Headers Configuration" icon={<Key className="w-5 h-5" />} isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Uses Headers</label>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={selectedServer.uses_headers} onCheckedChange={(v) => handleFieldChange('uses_headers', v)} />
                <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>{selectedServer.uses_headers ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <FieldInput label="Header Key Name" value={selectedServer.header_key_name || ''} onChange={(v) => handleFieldChange('header_key_name', v)} isDark={isDark} />
            <FieldInput label="Header Value" value={selectedServer.header_value || ''} onChange={(v) => handleFieldChange('header_value', v)} isDark={isDark} type="password" />
          </div>
        </SectionCard>

        {/* Response Parsing */}
        <SectionCard title="Response Parsing Paths" icon={<Server className="w-5 h-5" />} isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldInput label="Number ID Path" value={selectedServer.number_id_path || ''} onChange={(v) => handleFieldChange('number_id_path', v)} isDark={isDark} mono placeholder="e.g., data.id" />
            <FieldInput label="Phone Number Path" value={selectedServer.phone_number_path || ''} onChange={(v) => handleFieldChange('phone_number_path', v)} isDark={isDark} mono placeholder="e.g., data.phone" />
            <FieldInput label="OTP Path in JSON" value={selectedServer.otp_path_in_json || ''} onChange={(v) => handleFieldChange('otp_path_in_json', v)} isDark={isDark} mono placeholder="e.g., data.sms.text" />
          </div>
        </SectionCard>

        {/* Auto SMS Server Specific Fields */}
        {selectedServer.source_table === 'auto_sms_servers' && (
          <SectionCard title="Auto Import Settings" icon={<Key className="w-5 h-5" />} isDark={isDark} highlight>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Provider" value={selectedServer.provider || ''} onChange={(v) => handleFieldChange('provider', v)} isDark={isDark} />
              <FieldInput label="API Key" value={selectedServer.api_key || ''} onChange={(v) => handleFieldChange('api_key', v)} isDark={isDark} type="password" />
            </div>
          </SectionCard>
        )}

        {/* Metadata */}
        <SectionCard title="Metadata" icon={<Clock className="w-5 h-5" />} isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Created At</label>
              <p className={cn("text-sm py-2", isDark ? "text-gray-300" : "text-gray-700")}>{new Date(selectedServer.created_at).toLocaleString()}</p>
            </div>
            <div>
              <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Updated At</label>
              <p className={cn("text-sm py-2", isDark ? "text-gray-300" : "text-gray-700")}>{new Date(selectedServer.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Created By</label>
              <p className={cn("text-sm py-2 font-mono truncate", isDark ? "text-gray-300" : "text-gray-700")}>{selectedServer.created_by}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Server?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedServer.server_name}" and all its associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? "border-gray-700" : ""}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Section Card Component
function SectionCard({ 
  title, 
  icon, 
  children, 
  isDark, 
  highlight = false 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  isDark: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg p-4 border",
      highlight 
        ? (isDark ? "bg-primary/10 border-primary/30" : "bg-primary/5 border-primary/20")
        : (isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200")
    )}>
      <h2 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

// Reusable Field Input Component
function FieldInput({ 
  label, 
  value, 
  onChange, 
  isDark, 
  type = 'text', 
  mono = false, 
  placeholder 
}: { 
  label: string; 
  value: string | number; 
  onChange: (v: string) => void; 
  isDark: boolean; 
  type?: string; 
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          isDark ? "bg-gray-800 border-gray-700" : "bg-white",
          mono && "font-mono text-xs"
        )}
      />
    </div>
  );
}

export default function ShowAllServersPage() {
  return (
    <AdminLayout title="All Servers">
      <ShowAllServersContent />
    </AdminLayout>
  );
}
