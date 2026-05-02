'use client';

import React, { useState, useEffect } from 'react';
import BookingMetricsCards from '@/app/admin-dashboard/components/BookingMetricsCards';
import Icon from '@/components/ui/AppIcon';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MetricCard {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

const ReportsDashboardInteractive = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [bookingTrendsData, setBookingTrendsData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [propertyPerformanceData, setPropertyPerformanceData] = useState<any[]>([]);
  const [bookingSourceData, setBookingSourceData] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !user) return;
    fetchReportsData();
  }, [isHydrated, user, dateRange, propertyFilter]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Fetch properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, name, price_per_night')
        .eq('owner_id', user?.id);

      setProperties(propertiesData || []);
      const propertyIds = propertiesData?.map((p) => p.id) || [];

      if (propertyIds.length === 0) {
        setLoading(false);
        return;
      }

      const daysAgo = parseInt(dateRange);
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysAgo);
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

      // Apply property filter
      const filteredPropertyIds = propertyFilter === 'all' 
        ? propertyIds 
        : [propertyFilter];

      // Fetch current period bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, properties(name, price_per_night)')
        .in('property_id', filteredPropertyIds)
        .gte('created_at', startDate.toISOString());

      // Fetch previous period bookings for comparison
      const { data: prevBookings } = await supabase
        .from('bookings')
        .select('id, total_amount, status, check_in, check_out, created_at')
        .in('property_id', filteredPropertyIds)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Helper: calculate % change label
      const calcChange = (curr: number, prev: number): { label: string; type: 'positive' | 'negative' | 'neutral' } => {
        if (prev === 0) {
          if (curr === 0) return { label: '0%', type: 'neutral' };
          return { label: `+${curr > 0 ? curr.toFixed(0) : curr}`, type: 'positive' };
        }
        const pct = ((curr - prev) / prev) * 100;
        if (pct > 0) return { label: `+${pct.toFixed(1)}%`, type: 'positive' };
        if (pct < 0) return { label: `${pct.toFixed(1)}%`, type: 'negative' };
        return { label: '0%', type: 'neutral' };
      };

      // Calculate current period metrics
      const totalRevenue = bookings?.reduce(
        (sum, b) => sum + parseFloat(b.total_amount),
        0
      ) || 0;
      const totalBookings = bookings?.length || 0;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const confirmedBookings = bookings?.filter((b) => b.status === 'confirmed') || [];
      const totalDays = confirmedBookings.reduce((sum, b) => {
        const checkIn = new Date(b.check_in);
        const checkOut = new Date(b.check_out);
        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      const occupancyRate = (totalDays / (filteredPropertyIds.length * daysAgo)) * 100;

      // Calculate previous period metrics
      const prevRevenue = prevBookings?.reduce(
        (sum, b) => sum + parseFloat(b.total_amount),
        0
      ) || 0;
      const prevTotalBookings = prevBookings?.length || 0;
      const prevAvgBookingValue = prevTotalBookings > 0 ? prevRevenue / prevTotalBookings : 0;
      const prevConfirmedBookings = prevBookings?.filter((b) => b.status === 'confirmed') || [];
      const prevTotalDays = prevConfirmedBookings.reduce((sum, b) => {
        const checkIn = new Date(b.check_in);
        const checkOut = new Date(b.check_out);
        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      const prevOccupancyRate = (prevTotalDays / (filteredPropertyIds.length * daysAgo)) * 100;

      const revenueChange = calcChange(totalRevenue, prevRevenue);
      const occupancyChange = calcChange(occupancyRate, prevOccupancyRate);
      const avgValueChange = calcChange(avgBookingValue, prevAvgBookingValue);

      // Calculate average rating from properties
      const avgRating = propertiesData?.reduce((sum, p) => sum + (parseFloat(p.rating) || 0), 0) / (propertiesData?.length || 1);

      setMetrics([
        {
          id: 'revenue',
          label: 'Total Revenue',
          value: `$${totalRevenue.toFixed(0)}`,
          change: revenueChange.label,
          changeType: revenueChange.type,
          icon: 'CurrencyDollarIcon',
        },
        {
          id: 'occupancy',
          label: 'Occupancy Rate',
          value: `${occupancyRate.toFixed(1)}%`,
          change: occupancyChange.label,
          changeType: occupancyChange.type,
          icon: 'HomeIcon',
        },
        {
          id: 'booking-value',
          label: 'Avg Booking Value',
          value: `$${avgBookingValue.toFixed(0)}`,
          change: avgValueChange.label,
          changeType: avgValueChange.type,
          icon: 'ChartBarIcon',
        },
        {
          id: 'satisfaction',
          label: 'Guest Satisfaction',
          value: `${avgRating.toFixed(1)}/5.0`,
          change: '—',
          changeType: 'neutral',
          icon: 'StarIcon',
        },
      ]);

      // Booking trends by month
      const monthlyData: { [key: string]: { bookings: number; revenue: number } } = {};
      bookings?.forEach((booking) => {
        const month = new Date(booking.created_at).toLocaleString('default', {
          month: 'short',
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { bookings: 0, revenue: 0 };
        }
        monthlyData[month].bookings++;
        monthlyData[month].revenue += parseFloat(booking.total_amount);
      });

      const trends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        bookings: data.bookings,
        revenue: data.revenue,
      }));
      setBookingTrendsData(trends);

      // Property performance
      const propertyStats: { [key: string]: { name: string; bookings: number; revenue: number; occupancy: number } } = {};
      
      // Initialize all properties
      propertiesData?.forEach((prop) => {
        propertyStats[prop.id] = {
          name: prop.name,
          bookings: 0,
          revenue: 0,
          occupancy: 0,
        };
      });

      // Aggregate booking data
      bookings?.forEach((booking) => {
        const propId = booking.property_id;
        if (propertyStats[propId]) {
          propertyStats[propId].bookings++;
          propertyStats[propId].revenue += parseFloat(booking.total_amount);
        }
      });

      // Calculate occupancy for each property
      for (const propId in propertyStats) {
        const propBookings = bookings?.filter((b) => b.property_id === propId && b.status === 'confirmed') || [];
        const propDays = propBookings.reduce((sum, b) => {
          const checkIn = new Date(b.check_in);
          const checkOut = new Date(b.check_out);
          return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        propertyStats[propId].occupancy = Math.round((propDays / daysAgo) * 100);
      }

      const propPerformance = Object.values(propertyStats).map((data) => ({
        property: data.name,
        bookings: data.bookings,
        revenue: data.revenue,
        occupancy: data.occupancy,
      }));
      setPropertyPerformanceData(propPerformance);

      // Occupancy rate over last 6 months
      const occupancyByMonth: { [key: string]: { days: number; totalDays: number } } = {};
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        last6Months.push(monthKey);
        occupancyByMonth[monthKey] = { days: 0, totalDays: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() * filteredPropertyIds.length };
      }

      bookings?.forEach((booking) => {
        if (booking.status === 'confirmed') {
          const checkIn = new Date(booking.check_in);
          const checkOut = new Date(booking.check_out);
          const monthKey = checkIn.toLocaleString('default', { month: 'short' });
          if (occupancyByMonth[monthKey]) {
            const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            occupancyByMonth[monthKey].days += days;
          }
        }
      });

      const occupancyRates = last6Months.map((month) => ({
        month,
        rate: Math.round((occupancyByMonth[month].days / occupancyByMonth[month].totalDays) * 100),
      }));
      setOccupancyData(occupancyRates);

      // Seasonal patterns
      const seasonMap: { [key: string]: string } = {
        '0': 'Winter', '1': 'Winter', '2': 'Spring',
        '3': 'Spring', '4': 'Spring', '5': 'Summer',
        '6': 'Summer', '7': 'Summer', '8': 'Fall',
        '9': 'Fall', '10': 'Fall', '11': 'Winter',
      };

      const seasonalStats: { [key: string]: { bookings: number; revenue: number } } = {
        Spring: { bookings: 0, revenue: 0 },
        Summer: { bookings: 0, revenue: 0 },
        Fall: { bookings: 0, revenue: 0 },
        Winter: { bookings: 0, revenue: 0 },
      };

      bookings?.forEach((booking) => {
        const month = new Date(booking.created_at).getMonth();
        const season = seasonMap[month.toString()];
        seasonalStats[season].bookings++;
        seasonalStats[season].revenue += parseFloat(booking.total_amount);
      });

      const seasonal = Object.entries(seasonalStats).map(([season, data]) => ({
        season,
        bookings: data.bookings,
        revenue: data.revenue,
      }));
      setSeasonalData(seasonal);

      // Booking sources - data-driven: use booking status distribution as a meaningful metric
      // since there's no booking_source column, show status breakdown as "booking channels"
      const statusStats: { [key: string]: number } = {
        confirmed: 0,
        pending: 0,
        cancelled: 0,
      };

      bookings?.forEach((booking) => {
        const s = booking.status || 'pending';
        if (statusStats[s] !== undefined) {
          statusStats[s]++;
        }
      });

      const sources = [
        { name: 'Confirmed', value: statusStats['confirmed'], color: '#059669' },
        { name: 'Pending', value: statusStats['pending'], color: '#d97706' },
        { name: 'Cancelled', value: statusStats['cancelled'], color: '#dc2626' },
      ].filter((s) => s.value > 0);

      // If no bookings at all, show a placeholder
      if (sources.length === 0) {
        sources.push({ name: 'No Data', value: 1, color: '#e5e7eb' });
      }

      setBookingSourceData(sources);
    } catch (error: any) {
      console.error('Error fetching reports data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: string) => {
    if (format === 'csv') {
      // Build CSV from property performance data
      const headers = ['Property', 'Revenue ($)', 'Occupancy (%)', 'Bookings', 'Avg per Booking ($)'];
      const rows = propertyPerformanceData.map((p) => [
        `"${p.property}"`,
        p.revenue.toFixed(2),
        p.occupancy,
        p.bookings,
        p.bookings > 0 ? Math.round(p.revenue / p.bookings) : 0,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `booking-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      window.print();
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <BookingMetricsCards metrics={metrics} />

      {/* Filters and Export Controls */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-caption font-medium text-text-secondary">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {/* Property Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-caption font-medium text-text-secondary">
                Property
              </label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-4 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
              >
                <option value="all">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-md text-text-primary hover:bg-muted transition-smooth"
            >
              <Icon name="ArrowDownTrayIcon" variant="outline" size={20} />
              <span className="font-caption font-medium">CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
            >
              <Icon name="DocumentArrowDownIcon" variant="outline" size={20} />
              <span className="font-caption font-medium">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
        <div className="mb-6">
          <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">
            Booking Trends
          </h2>
          <p className="text-sm text-text-secondary">
            Monthly booking volume and revenue over the last 12 months
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={bookingTrendsData}>
            <defs>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="bookings"
              stroke="#1e3a8a"
              fillOpacity={1}
              fill="url(#colorBookings)"
              name="Bookings"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#d97706"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Revenue ($)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Occupancy Rate and Seasonal Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Rate */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">
              Occupancy Rate
            </h2>
            <p className="text-sm text-text-secondary">
              Capacity utilization over the last 6 months
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `${value}%`}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', r: 5 }}
                name="Occupancy Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Seasonal Patterns */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">
              Seasonal Patterns
            </h2>
            <p className="text-sm text-text-secondary">
              Booking trends and revenue by season
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={seasonalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="season" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="bookings"
                fill="#1e3a8a"
                name="Bookings"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="#d97706"
                name="Revenue ($)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Property Performance and Booking Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Performance */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">
              Property Performance
            </h2>
            <p className="text-sm text-text-secondary">
              Revenue comparison across properties
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={propertyPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="property" type="category" stroke="#6b7280" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="revenue" fill="#1e3a8a" radius={[0, 8, 8, 0]} name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Sources */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">
              Booking Status Breakdown
            </h2>
            <p className="text-sm text-text-secondary">
              Distribution of bookings by current status
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bookingSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Property Performance Table */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
        <div className="mb-6">
          <h2 className="font-heading font-semibold text-xl text-text-primary mb-1">
            Detailed Property Metrics
          </h2>
          <p className="text-sm text-text-secondary">
            Comprehensive performance data for all properties
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-caption font-semibold text-text-primary">
                  Property
                </th>
                <th className="text-right py-3 px-4 font-caption font-semibold text-text-primary">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 font-caption font-semibold text-text-primary">
                  Occupancy
                </th>
                <th className="text-right py-3 px-4 font-caption font-semibold text-text-primary">
                  Bookings
                </th>
                <th className="text-right py-3 px-4 font-caption font-semibold text-text-primary">
                  Avg/Booking
                </th>
              </tr>
            </thead>
            <tbody>
              {propertyPerformanceData.map((property, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted transition-smooth">
                  <td className="py-3 px-4 text-text-primary font-medium">{property.property}</td>
                  <td className="py-3 px-4 text-right text-text-primary font-data">
                    ${property.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-caption font-medium ${
                        property.occupancy >= 80
                          ? 'bg-success/10 text-success'
                          : property.occupancy >= 70
                            ? 'bg-warning/10 text-warning' :'bg-error/10 text-error'
                      }`}
                    >
                      {property.occupancy}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-text-primary font-data">
                    {property.bookings}
                  </td>
                  <td className="py-3 px-4 text-right text-text-primary font-data">
                    ${Math.round(property.revenue / property.bookings).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboardInteractive;
