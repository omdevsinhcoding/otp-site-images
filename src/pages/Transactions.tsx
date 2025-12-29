import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BannedUserOverlay } from '@/components/ui/BannedUserOverlay';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ResponsivePagination } from '@/components/ui/ResponsivePagination';
import { X, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import plusIcon from '@/assets/plus-icon.png';
import minusIcon from '@/assets/minus-icon.png';
import noDataIcon from '@/assets/no-data.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  created_at: string;
  admin_uid?: string | null;
  promo_creator_uid?: string | null;
  utr_number?: string | null;
}

const ITEMS_PER_PAGE = 9;

const Transactions = () => {
  const { user, loading } = useAuth();
  const db = useDatabase();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [dataLoading, setDataLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      try {
        const bal = await db.users.getWalletBalance(user.id);
        setBalance(bal);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    if (user?.id) fetchBalance();
  }, [user?.id, db.users]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return;
      
      setDataLoading(true);
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const typeFilter = filterType === 'all' ? undefined : filterType;
        
        const result = await db.transactions.getUserTransactions(
          user.id,
          ITEMS_PER_PAGE,
          offset,
          typeFilter
        );
        
        if (result.success && result.data) {
          setTransactions(result.data.transactions || []);
          setTotal(result.data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id, currentPage, filterType, db.transactions]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const isCredit = (type: string) => type === 'recharge' || type === 'referral_bonus' || type === 'promo_bonus' || type === 'refund';

  const formatTransactionLabel = (type: string) => {
    switch (type) {
      case 'recharge': return 'Recharge';
      case 'number_purchase': return 'Number Purchase';
      case 'withdrawal': return 'Withdrawal';
      case 'referral_bonus': return 'Referral Bonus';
      case 'promo_bonus': return 'Promo Code';
      case 'refund': return 'Refund';
      default: return type;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a d/M");
  };

  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd MMM yyyy, h:mm:ss a");
  };

  const maskUid = (uid: string) => {
    if (uid.length <= 6) return uid;
    return `${uid.slice(0, 3)}***${uid.slice(-3)}`;
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <DashboardLayout balance={balance}>
      {user.is_banned && <BannedUserOverlay />}
      <div className="px-[var(--page-padding-x)] max-w-6xl mx-auto space-y-4 xs:space-y-6">
        {/* Header with Filter */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4">
          <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground">Transactions</h1>
          <div className="relative self-start xs:self-auto">
            <span className="absolute -top-2.5 left-3 bg-background px-1 text-[10px] xs:text-xs text-muted-foreground">Type</span>
            <Select value={filterType} onValueChange={(val) => { setFilterType(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-auto min-w-[90px] xs:min-w-[100px] h-9 xs:h-10 sm:h-11 bg-background border-border text-xs xs:text-sm sm:text-base font-medium px-2.5 xs:px-3 pt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="min-w-0 w-[var(--radix-select-trigger-width)] bg-background z-50">
                <SelectItem value="all" className="py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-medium hover:bg-accent data-[state=checked]:bg-accent/50">All</SelectItem>
                <SelectItem value="recharge" className="py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-medium hover:bg-accent data-[state=checked]:bg-accent/50">Recharge</SelectItem>
                <SelectItem value="number_purchase" className="py-2 xs:py-2.5 text-xs xs:text-sm sm:text-base font-medium hover:bg-accent data-[state=checked]:bg-accent/50">Purchase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions Grid */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <OptimizedImage src={noDataIcon} alt="No Data" className="w-32 h-32 mb-4 rounded-lg" />
            <h6 className="text-lg font-semibold text-foreground">No History Found</h6>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="bg-card rounded-lg xs:rounded-xl p-2.5 xs:p-3 sm:p-4 border border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-2.5 xs:gap-3 sm:gap-4">
                  <OptimizedImage 
                    src={isCredit(tx.type) ? plusIcon : minusIcon} 
                    alt={isCredit(tx.type) ? 'Credit' : 'Debit'}
                    className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg"
                    priority
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm xs:text-base sm:text-lg ${isCredit(tx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isCredit(tx.type) ? '+' : '-'}₹{tx.amount}
                    </p>
                    <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground break-words">
                      {tx.admin_uid && tx.description ? tx.description : formatTransactionLabel(tx.type)} ( {formatDateTime(tx.created_at)} )
                    </p>
                    {tx.promo_creator_uid && tx.type === 'promo_bonus' && (
                      <p className="text-xs text-primary/70 mt-1 font-mono">
                        Created by Admin: {maskUid(tx.promo_creator_uid)}
                      </p>
                    )}
                    {tx.admin_uid && tx.type !== 'promo_bonus' && (
                      <p className="text-xs text-primary/70 mt-1 font-mono">
                        By Admin: {maskUid(tx.admin_uid)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <ResponsivePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Transaction Details Dialog */}
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <OptimizedImage 
                  src={selectedTx && isCredit(selectedTx.type) ? plusIcon : minusIcon} 
                  alt="Transaction"
                  className="w-6 h-6 rounded"
                />
                Transaction Details
              </DialogTitle>
            </DialogHeader>
            {selectedTx && (
              <div className="space-y-4">
                {/* Amount */}
                <div className="text-center py-3 bg-muted/50 rounded-lg">
                  <p className={`text-2xl font-bold ${isCredit(selectedTx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isCredit(selectedTx.type) ? '+' : '-'}₹{selectedTx.amount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatTransactionLabel(selectedTx.type)}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Transaction ID / UTR */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {selectedTx.utr_number ? 'UTR / Transaction ID' : 'Reference ID'}
                      </p>
                      <p className="text-sm font-mono truncate">
                        {selectedTx.utr_number || selectedTx.id}
                      </p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(selectedTx.utr_number || selectedTx.id, 'txId')}
                      className="p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0"
                    >
                      {copiedField === 'txId' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>

                  {/* Date & Time */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-medium">{formatFullDateTime(selectedTx.created_at)}</p>
                  </div>

                  {/* Type */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium capitalize">{selectedTx.type.replace('_', ' ')}</p>
                  </div>

                  {/* Description */}
                  {selectedTx.description && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm font-medium">{selectedTx.description}</p>
                    </div>
                  )}

                  {/* Admin UID */}
                  {selectedTx.admin_uid && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {selectedTx.type === 'promo_bonus' ? 'Promo Created By' : 'Processed By Admin'}
                        </p>
                        <p className="text-sm font-mono">{selectedTx.admin_uid}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedTx.admin_uid!, 'adminUid')}
                        className="p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0"
                      >
                        {copiedField === 'adminUid' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  )}

                  {/* Promo Creator UID */}
                  {selectedTx.promo_creator_uid && selectedTx.type === 'promo_bonus' && !selectedTx.admin_uid && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Promo Created By</p>
                        <p className="text-sm font-mono">{selectedTx.promo_creator_uid}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedTx.promo_creator_uid!, 'promoCreator')}
                        className="p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0"
                      >
                        {copiedField === 'promoCreator' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <p className="text-sm font-medium text-emerald-600">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;