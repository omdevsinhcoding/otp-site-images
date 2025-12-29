import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ArrowLeft, Package, Save, Loader2, Search, Trash2, AlertTriangle, Pencil, ChevronDown, Power, PowerOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServerOption {
  id: string;
  server_name: string;
  country_flag: string | null;
  source_table: 'sms_servers' | 'auto_sms_servers';
}

interface ServiceData {
  id: string;
  service_name: string;
  service_code: string;
  logo_url: string | null;
  base_price: number;
  margin_percentage: number;
  final_price: number | null;
  is_active: boolean;
  is_popular: boolean;
  cancel_disable_time: number;
  server_id: string;
  server_name?: string;
  source_table: 'services' | 'auto_services';
  operator?: string;
  created_at?: string;
  updated_at?: string;
}

// Memoized Service Row Component
const ServiceRow = memo(({ 
  service, 
  isDark, 
  deletingId,
  onEdit,
  onDelete 
}: { 
  service: ServiceData; 
  isDark: boolean;
  deletingId: string | null;
  onEdit: (service: ServiceData) => void;
  onDelete: (id: string) => void;
}) => (
  <div
    className={cn(
      "flex items-center gap-4 p-4 transition-colors border-b last:border-b-0",
      isDark ? "hover:bg-gray-800/50 border-gray-700" : "hover:bg-gray-50 border-gray-100"
    )}
  >
    {/* Logo */}
    {service.logo_url ? (
      <img src={service.logo_url} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" loading="lazy" />
    ) : (
      <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0", isDark ? "bg-gray-800" : "bg-gray-100")}>
        <Package className="w-5 h-5 text-gray-500" />
      </div>
    )}

    {/* Service Info */}
    <div className="flex-1 min-w-0">
      <h3 className={cn("font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>
        {service.service_name}
      </h3>
      <p className={cn("text-sm truncate", isDark ? "text-gray-400" : "text-gray-500")}>
        ~ {service.server_name}
      </p>
    </div>

    {/* Status badges */}
    <div className="hidden sm:flex items-center gap-2">
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-full",
        service.is_active 
          ? "bg-green-500/20 text-green-500" 
          : "bg-red-500/20 text-red-500"
      )}>
        {service.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>

    {/* Action buttons */}
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={() => onEdit(service)}
        className={cn(
          "h-9 w-9",
          isDark 
            ? "border-blue-500/50 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400" 
            : "border-blue-500 bg-blue-500 hover:bg-blue-600 text-white"
        )}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={() => onDelete(service.id)}
        disabled={deletingId === service.id}
        className={cn(
          "h-9 w-9",
          isDark 
            ? "border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-400" 
            : "border-red-500 bg-red-500 hover:bg-red-600 text-white"
        )}
      >
        {deletingId === service.id ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  </div>
));
ServiceRow.displayName = 'ServiceRow';

// Virtualized Services List Component  
const VirtualizedServicesList = memo(({
  services,
  isDark,
  deletingId,
  onEdit,
  onDelete
}: {
  services: ServiceData[];
  isDark: boolean;
  deletingId: string | null;
  onEdit: (service: ServiceData) => void;
  onDelete: (id: string) => void;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76, // Approximate row height
    overscan: 5,
  });

  return (
    <div 
      ref={parentRef}
      className={cn(
        "rounded-xl border overflow-y-auto max-h-[calc(100vh-280px)]",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const service = services[virtualRow.index];
          return (
            <div
              key={service.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ServiceRow
                service={service}
                isDark={isDark}
                deletingId={deletingId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
VirtualizedServicesList.displayName = 'VirtualizedServicesList';

function ShowAllServicesContent() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [originalServices, setOriginalServices] = useState<ServiceData[]>([]);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showServices, setShowServices] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [togglingAll, setTogglingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const { data: smsServers } = await supabase
        .from('sms_servers')
        .select('id, server_name, country_flag')
        .order('server_name');

      const { data: autoServers } = await supabase
        .from('auto_sms_servers')
        .select('id, server_name, country_flag')
        .order('server_name');

      const allServers: ServerOption[] = [
        ...(smsServers || []).map(s => ({ ...s, source_table: 'sms_servers' as const })),
        ...(autoServers || []).map(s => ({ ...s, source_table: 'auto_sms_servers' as const })),
      ];

      setServers(allServers);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleServerSelection = (serverId: string) => {
    setSelectedServers(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const handleProceed = async () => {
    if (selectedServers.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one server', variant: 'destructive' });
      return;
    }

    setLoadingServices(true);
    try {
      const { data: regularServices } = await supabase
        .from('services')
        .select('*')
        .in('server_id', selectedServers);

      const { data: autoServices } = await supabase
        .from('auto_services')
        .select('*')
        .in('server_id', selectedServers);

      const serverMap = new Map(servers.map(s => [s.id, s.server_name]));

      const allServices: ServiceData[] = [
        ...(regularServices || []).map(s => ({ 
          ...s, 
          source_table: 'services' as const,
          server_name: serverMap.get(s.server_id)
        })),
        ...(autoServices || []).map(s => ({ 
          ...s, 
          source_table: 'auto_services' as const,
          server_name: serverMap.get(s.server_id)
        })),
      ];

      setServices(allServices);
      setOriginalServices(JSON.parse(JSON.stringify(allServices))); // Deep copy for reset
      setShowServices(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingServices(false);
    }
  };

  const handleEditFieldChange = (field: keyof ServiceData, value: any) => {
    if (!editingService) return;
    setEditingService(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!editingService) return;
    setSaving(true);
    try {
      const updateData = {
        service_name: editingService.service_name,
        service_code: editingService.service_code,
        logo_url: editingService.logo_url,
        base_price: editingService.base_price,
        margin_percentage: editingService.margin_percentage,
        is_active: editingService.is_active,
        is_popular: editingService.is_popular,
        cancel_disable_time: editingService.cancel_disable_time,
      };

      const { error } = await supabase
        .from(editingService.source_table)
        .update(updateData)
        .eq('id', editingService.id);

      if (error) throw error;

      // Update local state
      setServices(prev => prev.map(s => 
        s.id === editingService.id ? { ...s, ...updateData } : s
      ));
      setEditingService(null);
      toast({ title: 'Success', description: 'Service updated successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: ServiceData) => {
    setDeletingId(service.id);
    try {
      const { error } = await supabase
        .from(service.source_table)
        .delete()
        .eq('id', service.id);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== service.id));
      setDeleteConfirmId(null);
      toast({ title: 'Deleted', description: 'Service deleted successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const selectedSmsServerIds = servers
        .filter((s) => selectedServers.includes(s.id) && s.source_table === 'sms_servers')
        .map((s) => s.id);
      const selectedAutoServerIds = servers
        .filter((s) => selectedServers.includes(s.id) && s.source_table === 'auto_sms_servers')
        .map((s) => s.id);

      if (selectedSmsServerIds.length > 0) {
        const { error } = await supabase
          .from('services')
          .delete()
          .in('server_id', selectedSmsServerIds);
        if (error) throw error;
      }

      if (selectedAutoServerIds.length > 0) {
        const { error } = await supabase
          .from('auto_services')
          .delete()
          .in('server_id', selectedAutoServerIds);
        if (error) throw error;
      }

      setServices([]);
      setDeleteAllDialogOpen(false);
      toast({ title: 'Deleted', description: 'All services deleted successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingAll(false);
    }
  };

  const handleToggleAllServices = async (activate: boolean) => {
    setTogglingAll(true);
    try {
      const selectedSmsServerIds = servers
        .filter((s) => selectedServers.includes(s.id) && s.source_table === 'sms_servers')
        .map((s) => s.id);
      const selectedAutoServerIds = servers
        .filter((s) => selectedServers.includes(s.id) && s.source_table === 'auto_sms_servers')
        .map((s) => s.id);

      if (selectedSmsServerIds.length > 0) {
        const { error } = await supabase
          .from('services')
          .update({ is_active: activate })
          .in('server_id', selectedSmsServerIds);
        if (error) throw error;
      }

      if (selectedAutoServerIds.length > 0) {
        const { error } = await supabase
          .from('auto_services')
          .update({ is_active: activate })
          .in('server_id', selectedAutoServerIds);
        if (error) throw error;
      }

      // Update local state
      setServices((prev) => prev.map((s) => ({ ...s, is_active: activate })));
      toast({
        title: 'Success',
        description: `All services ${activate ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setTogglingAll(false);
    }
  };

  const handleResetToOriginal = async () => {
    setTogglingAll(true);
    try {
      if (!originalServices.length) {
        toast({ title: 'Nothing to reset', description: 'No original state saved yet.', variant: 'destructive' });
        return;
      }

      const chunk = <T,>(arr: T[], size: number) => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      const updateIds = async (table: 'services' | 'auto_services', ids: string[], isActive: boolean) => {
        for (const batch of chunk(ids, 100)) {
          const { error } = await supabase.from(table).update({ is_active: isActive }).in('id', batch);
          if (error) throw error;
        }
      };

      const regularTrueIds = originalServices
        .filter((s) => s.source_table === 'services' && s.is_active)
        .map((s) => s.id);
      const regularFalseIds = originalServices
        .filter((s) => s.source_table === 'services' && !s.is_active)
        .map((s) => s.id);

      const autoTrueIds = originalServices
        .filter((s) => s.source_table === 'auto_services' && s.is_active)
        .map((s) => s.id);
      const autoFalseIds = originalServices
        .filter((s) => s.source_table === 'auto_services' && !s.is_active)
        .map((s) => s.id);

      await updateIds('services', regularTrueIds, true);
      await updateIds('services', regularFalseIds, false);
      await updateIds('auto_services', autoTrueIds, true);
      await updateIds('auto_services', autoFalseIds, false);

      // Restore local state
      setServices(JSON.parse(JSON.stringify(originalServices)));
      toast({ title: 'Success', description: 'All services reset to original state' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setTogglingAll(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.service_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.server_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Server Selection View
  if (!showServices) {
    return (
      <div className="space-y-6">
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

        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            Select Servers
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
            Choose one or more servers to view their services
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className={cn(
              "rounded-xl border p-4 space-y-3 max-h-[400px] overflow-y-auto",
              isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            )}>
              {servers.map((server) => (
                <label
                  key={server.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedServers.includes(server.id)
                      ? isDark ? "bg-primary/20 border border-primary/50" : "bg-primary/10 border border-primary/30"
                      : isDark ? "bg-gray-800 hover:bg-gray-750" : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <Checkbox
                    checked={selectedServers.includes(server.id)}
                    onCheckedChange={() => toggleServerSelection(server.id)}
                  />
                  <span className="text-xl">{server.country_flag || '🌍'}</span>
                  <div className="flex-1">
                    <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {server.server_name}
                    </p>
                    <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                      {server.source_table === 'auto_sms_servers' ? 'Auto Import' : 'Manual'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleProceed}
                disabled={selectedServers.length === 0 || loadingServices}
                className="flex-1 sm:flex-none"
              >
                {loadingServices ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Proceed ({selectedServers.length} selected)
              </Button>
              {selectedServers.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedServers([])}
                  className={isDark ? "border-gray-700" : ""}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Edit Service View
  if (editingService) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setEditingService(null)}
          className={cn(
            "group flex items-center gap-2",
            isDark 
              ? "border-gray-700 text-gray-300 hover:bg-gray-800" 
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Services List
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {editingService.logo_url ? (
              <img src={editingService.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", isDark ? "bg-gray-800" : "bg-gray-100")}>
                <Package className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div>
              <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                Edit Service
              </h1>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {editingService.server_name} • ID: {editingService.id}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            Save Changes
          </Button>
        </div>

        <div className={cn("rounded-xl border p-6 space-y-6", isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200")}>
          {/* Basic Info */}
          <div>
            <h2 className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldInput label="Service Name" value={editingService.service_name} onChange={(v) => handleEditFieldChange('service_name', v)} isDark={isDark} />
              <FieldInput label="Service Code" value={editingService.service_code} onChange={(v) => handleEditFieldChange('service_code', v)} isDark={isDark} />
              <FieldInput label="Logo URL" value={editingService.logo_url || ''} onChange={(v) => handleEditFieldChange('logo_url', v)} isDark={isDark} placeholder="https://example.com/logo.png" />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
              Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldInput label="Base Price" type="number" value={editingService.base_price} onChange={(v) => handleEditFieldChange('base_price', parseFloat(v) || 0)} isDark={isDark} />
              <FieldInput label="Margin %" type="number" value={editingService.margin_percentage} onChange={(v) => handleEditFieldChange('margin_percentage', parseFloat(v) || 0)} isDark={isDark} />
              <div>
                <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Final Price</label>
                <p className={cn("text-lg font-semibold py-2", isDark ? "text-white" : "text-gray-900")}>
                  ₹{(editingService.base_price * (1 + editingService.margin_percentage / 100)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
              Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldInput label="Cancel Disable Time (seconds)" type="number" value={editingService.cancel_disable_time} onChange={(v) => handleEditFieldChange('cancel_disable_time', parseInt(v) || 0)} isDark={isDark} />
              <div>
                <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Active Status</label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={editingService.is_active} onCheckedChange={(v) => handleEditFieldChange('is_active', v)} />
                  <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>{editingService.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div>
                <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Popular</label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={editingService.is_popular} onCheckedChange={(v) => handleEditFieldChange('is_popular', v)} />
                  <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-700")}>{editingService.is_popular ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h2 className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
              Metadata
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Server</label>
                <p className={cn("text-sm py-2", isDark ? "text-gray-300" : "text-gray-700")}>{editingService.server_name}</p>
              </div>
              <div>
                <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Source</label>
                <p className={cn("text-sm py-2", isDark ? "text-gray-300" : "text-gray-700")}>{editingService.source_table === 'auto_services' ? 'Auto Import' : 'Manual'}</p>
              </div>
              {editingService.operator && (
                <div>
                  <label className={cn("text-xs font-medium block mb-1", isDark ? "text-gray-400" : "text-gray-600")}>Operator</label>
                  <p className={cn("text-sm py-2", isDark ? "text-gray-300" : "text-gray-700")}>{editingService.operator}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Services List View (compact like reference image)
  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => setShowServices(false)}
        className={cn(
          "group flex items-center gap-2",
          isDark 
            ? "border-gray-700 text-gray-300 hover:bg-gray-800" 
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Server Selection
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
            All Services
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
            {services.length} services from {selectedServers.length} server(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9", isDark ? "bg-gray-800 border-gray-700" : "bg-white")}
            />
          </div>
          {services.length > 0 && (
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={togglingAll}
                    className={cn("shrink-0", isDark ? "border-gray-700" : "")}
                  >
                    {togglingAll ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Power className="w-4 h-4 mr-1.5" />}
                    Bulk Actions
                    <ChevronDown className="w-4 h-4 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  sideOffset={4}
                  className={cn(
                    "z-50 min-w-[200px]",
                    isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                  )}
                >
                  <DropdownMenuItem 
                    onSelect={() => handleToggleAllServices(true)}
                    className={cn("cursor-pointer", isDark ? "text-green-400 focus:text-green-400 focus:bg-green-500/20" : "text-green-600")}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Activate All Services
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => handleToggleAllServices(false)}
                    className={cn("cursor-pointer", isDark ? "text-yellow-400 focus:text-yellow-400 focus:bg-yellow-500/20" : "text-yellow-600")}
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Deactivate All Services
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? "bg-gray-700" : ""} />
                  <DropdownMenuItem 
                    onSelect={handleResetToOriginal}
                    className={cn("cursor-pointer", isDark ? "text-blue-400 focus:text-blue-400 focus:bg-blue-500/20" : "text-blue-600")}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Original
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                onClick={() => setDeleteAllDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete All
              </Button>
            </>
          )}
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className={cn(
          "text-center py-12 rounded-xl border",
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
          <Package className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-400")} />
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>No services found</p>
        </div>
      ) : (
        <VirtualizedServicesList
          services={filteredServices}
          isDark={isDark}
          deletingId={deletingId}
          onEdit={setEditingService}
          onDelete={setDeleteConfirmId}
        />
      )}

      {/* Delete All Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete All Services?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {services.length} services from the selected servers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? "border-gray-700" : ""}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Service Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className={isDark ? "bg-gray-900 border-gray-700" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Service?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? "border-gray-700" : ""}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const service = services.find(s => s.id === deleteConfirmId);
                if (service) handleDelete(service);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FieldInput({ 
  label, 
  value, 
  onChange, 
  isDark, 
  type = 'text', 
  placeholder 
}: { 
  label: string; 
  value: string | number; 
  onChange: (v: string) => void; 
  isDark: boolean; 
  type?: string; 
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
        className={cn(isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50")}
      />
    </div>
  );
}

export default function ShowAllServicesPage() {
  return (
    <AdminLayout title="All Services">
      <ShowAllServicesContent />
    </AdminLayout>
  );
}
