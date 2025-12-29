import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  ShoppingCart, Activity, ArrowUpRight, ArrowDownRight, ArrowLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { title: 'Total Revenue', value: '₹12,48,500', change: '+15.3%', trend: 'up', icon: DollarSign },
  { title: 'Total Users', value: '15,847', change: '+8.2%', trend: 'up', icon: Users },
  { title: 'Total Orders', value: '45,239', change: '+12.1%', trend: 'up', icon: ShoppingCart },
  { title: 'Active Services', value: '342', change: '-2.4%', trend: 'down', icon: Activity },
];

const topServices = [
  { name: 'WhatsApp India', orders: 12500, revenue: 150000, growth: 15.2 },
  { name: 'Telegram Premium', orders: 8900, revenue: 71200, growth: 8.5 },
  { name: 'Instagram Verification', orders: 6500, revenue: 97500, growth: 22.3 },
  { name: 'Facebook OTP', orders: 4200, revenue: 42000, growth: -5.1 },
  { name: 'Google Voice', orders: 3800, revenue: 76000, growth: 10.8 },
];

const recentStats = [
  { label: 'Today', orders: 1284, revenue: 15408 },
  { label: 'Yesterday', orders: 1156, revenue: 13872 },
  { label: 'This Week', orders: 8956, revenue: 107472 },
  { label: 'This Month', orders: 32450, revenue: 389400 },
];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <AdminLayout title="Analytics">
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
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <div className={cn(
                      "flex items-center gap-1 mt-2 text-sm font-medium",
                      stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">{stat.label}</span>
                    <div className="text-right">
                      <p className="font-bold">₹{stat.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{stat.orders.toLocaleString()} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Performing Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.orders.toLocaleString()} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{service.revenue.toLocaleString()}</p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 text-sm",
                        service.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {service.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(service.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Placeholder */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Chart visualization will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
