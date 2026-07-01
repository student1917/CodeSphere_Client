import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'blue' | 'indigo' | 'purple' | 'green' | 'orange' | 'red';
}

const AdminStatCard = ({ title, value, icon, trend, color = 'blue' }: AdminStatCardProps) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isUp ? '+' : '-'}{trend.value}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">{title}</h3>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      </div>
    </div>
  );
};

export default AdminStatCard;

