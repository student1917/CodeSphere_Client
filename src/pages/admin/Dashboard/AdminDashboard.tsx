import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiFileText, FiTag, FiPlus, FiRefreshCw, FiUsers, FiAward, FiActivity, FiArrowUpRight, FiClock, FiMessageSquare, FiGlobe, FiCheckCircle } from 'react-icons/fi';
import Loading from '@/components/Loading';
import { adminApi } from '@/apis/admin.api';
import { ROUTES } from '@/utils/constants';
import type { DashboardStatsResponse } from '@/types/admin.types';
import AdminStatCard from '@/components/Admin/AdminStatCard';
import AdminPageHeader from '@/components/Admin/AdminPageHeader';

const SubmissionAccuracyChart = ({ data }: { data: Array<{ date: string; submissions: number; accuracyRate: number }> }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const totalSubmissions = data.reduce((sum, d) => sum + d.submissions, 0);
  const avgAccuracy = data.length > 0
    ? Math.round((data.reduce((sum, d) => sum + d.accuracyRate, 0) / data.length) * 100) / 100
    : 0;

  const maxSubmissionsRaw = Math.max(1, ...data.map((d) => d.submissions));
  const maxSubmissions = Math.max(5, Math.ceil(maxSubmissionsRaw / 5) * 5);

  const chartWidth = Math.max(780, data.length * 58);
  const padding = { top: 16, right: 44, bottom: 44, left: 44 };
  const chartHeight = 240;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const xAt = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index * plotWidth) / (data.length - 1);
  };

  const ySubmission = (value: number) => {
    return padding.top + (1 - value / maxSubmissions) * plotHeight;
  };

  const yAccuracy = (value: number) => {
    const normalized = Math.max(0, Math.min(100, value));
    return padding.top + (1 - normalized / 100) * plotHeight;
  };

  const barWidth = Math.max(10, Math.min(22, plotWidth / Math.max(1, data.length * 1.8)));

  const accuracyPoints = data.map((d, idx) => `${xAt(idx)},${yAccuracy(d.accuracyRate)}`).join(' ');

  const formatLabel = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    } catch {
      return isoDate;
    }
  };

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900">Submissions & Accuracy Trend</h3>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last 14 days</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Submissions</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{totalSubmissions}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Accuracy</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{avgAccuracy}%</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Peak Submissions</div>
          <div className="text-xl font-extrabold text-blue-600 mt-1">{maxSubmissionsRaw}</div>
        </div>
      </div>

      <div className="relative pb-2">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[280px]">
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const y = padding.top + tick * plotHeight;
            const leftValue = Math.round((1 - tick) * maxSubmissions);
            const rightValue = Math.round((1 - tick) * 100);

            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{leftValue}</text>
                <text x={chartWidth - padding.right + 8} y={y + 4} textAnchor="start" fontSize="10" fill="#64748b">{rightValue}%</text>
              </g>
            );
          })}

          {data.map((point, idx) => {
            const x = xAt(idx);
            const y = ySubmission(point.submissions);
            return (
              <rect
                key={point.date}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(2, padding.top + plotHeight - y)}
                rx={4}
                fill={hoveredIndex === idx ? '#2563eb' : '#3b82f6'}
              />
            );
          })}

          <polyline fill="none" stroke="#ef4444" strokeWidth="3" points={accuracyPoints} />

          {data.map((point, idx) => {
            const x = xAt(idx);
            const y = yAccuracy(point.accuracyRate);
            return (
              <circle
                key={`${point.date}-dot`}
                cx={x}
                cy={y}
                r={hoveredIndex === idx ? 5 : 3.5}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}

          {data.map((point, idx) => {
            const x = xAt(idx);
            return (
              <rect
                key={`${point.date}-hover`}
                x={x - Math.max(12, barWidth)}
                y={padding.top}
                width={Math.max(24, barWidth * 2)}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {data.map((point, idx) => (
            <text
              key={`${point.date}-label`}
              x={xAt(idx)}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight="600"
            >
              {formatLabel(point.date)}
            </text>
          ))}
        </svg>

        {hoveredPoint && hoveredIndex !== null && (
          <div className="absolute top-2 right-2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="font-bold">{formatLabel(hoveredPoint.date)}</div>
            <div>Submissions: {hoveredPoint.submissions}</div>
            <div>Accuracy: {hoveredPoint.accuracyRate}%</div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-6 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          <span>Submissions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-[2px] bg-red-500 inline-block" />
          <span>Accuracy %</span>
        </div>
      </div>
    </div>
  );
};

const RecentActivityItem = ({ text, time, icon, color = 'blue' }: any) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
      <div className={`p-2 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{text}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          <FiClock size={12} />
          {time}
        </p>
      </div>
      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
        <FiArrowUpRight size={18} />
      </button>
    </div>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (e: any) {
        console.error(e);
        setError(e?.response?.data?.message || e?.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Loading text="Loading your dashboard..." />
      </div>
    );
  }

  const recentActivities = [
    { text: 'New problem "Dynamic Programming Intro" created', time: '2 hours ago', icon: <FiFileText />, color: 'blue' },
    { text: 'User @john_doe promoted to Administrator', time: '5 hours ago', icon: <FiUsers />, color: 'purple' },
    { text: 'Weekly Contest #42 started', time: '1 day ago', icon: <FiAward />, color: 'green' },
    { text: 'System maintenance scheduled for Sunday', time: '2 days ago', icon: <FiActivity />, color: 'orange' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {(stats?.spamSpikeAlert || stats?.postingSpikeAlert) && (
        <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-3">
          <FiActivity className="flex-shrink-0" />
          <p className="text-sm font-semibold">{stats?.alertMessage || 'Abnormal spike detected in posting/reporting activity.'}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-3">
          <FiActivity className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <AdminPageHeader 
        title="Dashboard Overview" 
        subtitle="Welcome back, Admin. Here's what's happening today."
        actions={
          <>
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm"
            >
              <FiRefreshCw size={18} />
              <span>Refresh</span>
            </button>
            <Link 
              to="/admin/problems/new" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-600/20"
            >
              <FiPlus size={18} />
              <span>New Problem</span>
            </Link>
          </>
        }
      />

      {/* Main Stats */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 small_desktop:grid-cols-4 desktop:grid-cols-4 gap-6">
        <AdminStatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={<FiUsers size={20} />} color="blue" />
        <AdminStatCard title="Active Now" value={stats?.activeNow ?? 0} icon={<FiActivity size={20} />} color="green" />
        <AdminStatCard title="Blocked" value={stats?.blockedUsers ?? 0} icon={<FiUsers size={20} />} color="red" />
        <AdminStatCard title="Administrators" value={stats?.administrators ?? 0} icon={<FiUsers size={20} />} color="purple" />
      </div>

      {/* Moderation KPI */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 px-1">Moderation KPI</h3>
        <div className="grid grid-cols-1 tablet:grid-cols-2 small_desktop:grid-cols-4 desktop:grid-cols-4 gap-6">
          <AdminStatCard title="New Posts (Today)" value={stats?.newPostsToday ?? 0} icon={<FiMessageSquare size={20} />} color="blue" />
          <AdminStatCard title="New Posts (Week)" value={stats?.newPostsThisWeek ?? 0} icon={<FiMessageSquare size={20} />} color="indigo" />
          <AdminStatCard title="Violation Reports (Today)" value={stats?.violationReportsToday ?? 0} icon={<FiActivity size={20} />} color="red" />
          <AdminStatCard title="Violation Reports (Week)" value={stats?.violationReportsThisWeek ?? 0} icon={<FiActivity size={20} />} color="orange" />
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-2 small_desktop:grid-cols-3 desktop:grid-cols-3 gap-6">
          <AdminStatCard title="Handled Today" value={stats?.moderationHandledToday ?? 0} icon={<FiCheckCircle size={20} />} color="green" />
          <AdminStatCard title="Avg Handle Time (h)" value={stats?.avgModerationHoursThisWeek ?? 0} icon={<FiClock size={20} />} color="purple" />
          <AdminStatCard title="Restore Rate (Week)" value={`${stats?.restoreRateThisWeek ?? 0}%`} icon={<FiRefreshCw size={20} />} color="emerald" />
        </div>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-1 small_desktop:grid-cols-3 desktop:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="small_desktop:col-span-2 desktop:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {recentActivities.map((activity, index) => (
              <RecentActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>

        {/* Quick Insights & Actions */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 px-2">Performance</h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-500">Active Users</span>
                  <span className="text-blue-600">{stats?.activeUsers ?? 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-500">New Users (Month)</span>
                  <span className="text-indigo-600">{stats?.newUsersThisMonth ?? 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-500">Daily Submissions</span>
                  <span className="text-emerald-600">{stats?.submissionsToday ?? 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-500">Moderation Handled (Week)</span>
                  <span className="text-rose-600">{stats?.moderationHandledThisWeek ?? 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, ((stats?.moderationHandledThisWeek ?? 0) / 100) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 px-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/categories" className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                  <FiTag size={20} />
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700 uppercase tracking-wider">Tags</span>
              </Link>
              <Link to="/admin/languages" className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                  <FiGlobe size={20} />
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700 uppercase tracking-wider">Languages</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {stats?.submissionTrend && stats.submissionTrend.length > 0 && (
        <SubmissionAccuracyChart
          data={stats.submissionTrend.map((item) => ({
            date: item.date,
            submissions: item.submissions,
            accuracyRate: item.accuracyRate,
          }))}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
