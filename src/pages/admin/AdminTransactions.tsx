import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download, Bitcoin, CreditCard, Gift, Wallet, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  user: string;
  type: 'crypto' | 'upi' | 'promo';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', user: 'Rahul Singh', type: 'upi', amount: 500, status: 'completed', date: '2024-01-15 10:30', reference: 'UPI12345678' },
  { id: '2', user: 'Priya Sharma', type: 'crypto', amount: 1000, status: 'completed', date: '2024-01-15 09:45', reference: '0x1234...5678' },
  { id: '3', user: 'Amit Kumar', type: 'promo', amount: 100, status: 'completed', date: '2024-01-15 08:20', reference: 'PROMO100' },
  { id: '4', user: 'Neha Gupta', type: 'upi', amount: 250, status: 'pending', date: '2024-01-15 07:15', reference: 'UPI87654321' },
  { id: '5', user: 'Vikram Patel', type: 'crypto', amount: 2000, status: 'failed', date: '2024-01-14 18:30', reference: '0xabcd...efgh' },
];

export default function AdminTransactions() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = tx.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || tx.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'crypto': return <Bitcoin className="w-4 h-4" />;
      case 'upi': return <CreditCard className="w-4 h-4" />;
      case 'promo': return <Gift className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout title="Transactions">
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{mockTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Bitcoin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{mockTransactions.filter(t => t.type === 'crypto').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Crypto Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{mockTransactions.filter(t => t.type === 'upi').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">UPI Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{mockTransactions.filter(t => t.type === 'promo').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Promo Redeemed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
                <TabsTrigger value="upi">UPI</TabsTrigger>
                <TabsTrigger value="promo">Promo Codes</TabsTrigger>
              </TabsList>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.user}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "p-1.5 rounded",
                            tx.type === 'crypto' && "bg-orange-100 text-orange-600",
                            tx.type === 'upi' && "bg-blue-100 text-blue-600",
                            tx.type === 'promo' && "bg-pink-100 text-pink-600",
                          )}>
                            {getTypeIcon(tx.type)}
                          </span>
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{tx.amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "capitalize",
                          tx.status === 'completed' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                          tx.status === 'pending' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                          tx.status === 'failed' && "bg-red-100 text-red-700 hover:bg-red-100",
                        )}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
