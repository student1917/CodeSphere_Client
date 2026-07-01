import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiRefreshCw, FiClock, FiShield, FiFilter, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

import Loading from '@/components/Loading';
import AdminPageHeader from '@/components/Admin/AdminPageHeader';
import AdminStatCard from '@/components/Admin/AdminStatCard';
import { adminApi } from '@/apis/admin.api';
import type { AuditLogItem } from '@/types/admin.types';
import type { PageResponse } from '@/types/common.types';

const ACTION_OPTIONS = [
  '',
  'POST_BLOCK',
  'POST_UNBLOCK',
  'POST_DELETE',
  'USER_STATUS_UPDATE',
  'USER_BLOCK',
  'USER_UNBLOCK',
  'USER_ROLE_CHANGE',
  'USER_DELETE',
  'PROBLEM_CREATE',
  'PROBLEM_UPDATE',
  'PROBLEM_DELETE',
  'CONTEST_CREATE',
  'CONTEST_UPDATE',
  'CONTEST_DELETE',
  'CONTEST_ADD_PROBLEM',
  'CONTEST_REMOVE_PROBLEM',
  'CONTEST_TOGGLE_VISIBILITY',
  'LANGUAGE_CREATE',
  'LANGUAGE_UPDATE',
  'LANGUAGE_DELETE',
  'CATEGORY_CREATE',
  'CATEGORY_DELETE',
  'TAG_CREATE',
  'TAG_DELETE',
];

const OBJECT_OPTIONS = ['', 'POST', 'USER', 'PROBLEM', 'CONTEST', 'LANGUAGE', 'CATEGORY', 'TAG'];

const prettyDateTime = (iso: string) => {
  try {
    const date = new Date(iso);
    return date.toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
};

const truncate = (value: string | null | undefined, max = 60) => {
  if (!value) return '-';
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
};

const extractModerationReason = (log: AuditLogItem) => {
  try {
    const parsed = JSON.parse(log.afterState || '{}') as {
      moderationReasonCode?: string;
      moderationReasonDetail?: string;
    };
    const reasonCode = parsed.moderationReasonCode?.trim();
    const reasonDetail = parsed.moderationReasonDetail?.trim();

    if (!reasonCode && !reasonDetail) {
      return null;
    }

    return {
      reasonCode: reasonCode || '-',
      reasonDetail: reasonDetail || '-',
    };
  } catch {
    return null;
  }
};

const AdminAuditLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [objectType, setObjectType] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (q.trim()) params.q = q.trim();
      if (action) params.action = action;
      if (objectType) params.objectType = objectType;
      if (fromTime) params.fromTime = new Date(fromTime).toISOString();
      if (toTime) params.toTime = new Date(toTime).toISOString();

      const data = await adminApi.getAuditLogs(page, size, params);
      if (data && 'content' in data) {
        const pageData = data as PageResponse<AuditLogItem>;
        setLogs(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
      } else {
        setLogs([]);
        setTotalPages(0);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to fetch audit logs');
      setLogs([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action, objectType]);

  const summary = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const todayCount = logs.filter((log) => new Date(log.createdAt).getTime() >= startOfToday).length;
    const postCount = logs.filter((log) => log.objectType === 'POST').length;
    const userCount = logs.filter((log) => log.objectType === 'USER').length;

    return { todayCount, postCount, userCount };
  }, [logs]);

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Audit Logs"
        subtitle="Tra cuu chi tiet ai da thao tac gi, luc nao, tren doi tuong nao va before/after thay doi."
        actions={
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 tablet:grid-cols-3 gap-6">
        <AdminStatCard title="Logs (Current Page)" value={logs.length} icon={<FiFileText size={20} />} color="blue" />
        <AdminStatCard title="Today (Current Page)" value={summary.todayCount} icon={<FiClock size={20} />} color="green" />
        <AdminStatCard title="User Actions (Current Page)" value={summary.userCount} icon={<FiShield size={20} />} color="indigo" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/40">
          <div className="grid grid-cols-1 desktop:grid-cols-6 gap-3">
            <div className="desktop:col-span-2 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(0);
                    fetchLogs();
                  }
                }}
                placeholder="Search actor, action, object, summary"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>

            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.filter(Boolean).map((it) => (
                <option key={it} value={it}>{it}</option>
              ))}
            </select>

            <select
              value={objectType}
              onChange={(e) => {
                setObjectType(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            >
              <option value="">All Objects</option>
              {OBJECT_OPTIONS.filter(Boolean).map((it) => (
                <option key={it} value={it}>{it}</option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />

            <input
              type="datetime-local"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                setPage(0);
                fetchLogs();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>

            <button
              onClick={() => {
                setQ('');
                setAction('');
                setObjectType('');
                setFromTime('');
                setToTime('');
                setPage(0);
                setTimeout(fetchLogs, 0);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-14 flex items-center justify-center">
            <Loading />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Object</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FiFilter size={34} className="opacity-30" />
                        <p>No audit logs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 align-top text-[12px] text-slate-700 whitespace-nowrap">{prettyDateTime(log.createdAt)}</td>
                      <td className="p-4 align-top">
                        <div className="text-[13px] font-semibold text-slate-900">{log.actorUsername || '-'}</div>
                        <div className="text-[11px] text-slate-500">ID: {log.actorId ?? '-'}</div>
                        <div className="text-[11px] text-slate-500">{log.actorRole || '-'}</div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-[13px] font-semibold text-slate-900">{log.objectType}</div>
                        <div className="text-[11px] text-slate-500">ID: {log.objectId ?? '-'}</div>
                        <div className="text-[11px] text-slate-500">{truncate(log.objectLabel, 36)}</div>
                      </td>
                      <td className="p-4 align-top min-w-[320px]">
                        {log.objectType === 'POST' && (log.action === 'POST_BLOCK' || log.action === 'POST_DELETE') ? (
                          (() => {
                            const reason = extractModerationReason(log);
                            return (
                              <div className="space-y-1">
                                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Moderation reason</div>
                                <div className="text-[12px] text-slate-700">
                                  Code: <span className="font-semibold">{reason?.reasonCode || '-'}</span>
                                </div>
                                <div className="text-[12px] text-slate-700 break-words">
                                  Detail: <span className="font-semibold">{reason?.reasonDetail || '-'}</span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-[12px] text-slate-700">{truncate(log.changeSummary, 120)}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-900">{logs.length}</span> logs on page <span className="text-slate-900">{page + 1}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Previous
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
