import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AdminPageHeader = ({ title, subtitle, actions }: AdminPageHeaderProps) => {
  return (
    <div className="flex flex-col tablet:flex-row small_desktop:flex-row desktop:flex-row tablet:items-center small_desktop:items-center desktop:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;

