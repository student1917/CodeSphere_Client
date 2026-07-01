import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Loading from '@/components/Loading';
import { adminApi } from '@/apis/admin.api';
import type { AdminPostItem, ModerationReasonTemplate, PostReportResponse } from '@/apis/admin.api';
import type { PageResponse } from '@/types/common.types';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiX,
  FiMessageSquare,
  FiSlash,
  FiEye,
  FiExternalLink,
  FiTrash2,
  FiCheckCircle,
  FiAlertTriangle,
  FiFlag,
} from 'react-icons/fi';
import Tooltip from '@/components/Layout/Tooltip';
import AdminStatCard from '@/components/Admin/AdminStatCard';
import AdminPageHeader from '@/components/Admin/AdminPageHeader';

type ModerationAction = 'block' | 'delete';

const FALLBACK_REASON_TEMPLATES: ModerationReasonTemplate[] = [
  { code: 'SPAM', label: 'Spam', description: 'Noi dung quang cao, lap lai hoac gay nhieu.' },
  { code: 'HARASSMENT', label: 'Harassment', description: 'Noi dung quay roi, xuc pham ca nhan.' },
  { code: 'HATE_SPEECH', label: 'Hate Speech', description: 'Noi dung thu ghet, ky thi hoac phan biet doi xu.' },
  { code: 'EXPLICIT_CONTENT', label: 'Explicit Content', description: 'Noi dung nhay cam khong phu hop.' },
  { code: 'ILLEGAL_CONTENT', label: 'Illegal Content', description: 'Noi dung vi pham phap luat.' },
  { code: 'MISINFORMATION', label: 'Misinformation', description: 'Thong tin sai lech gay hieu nham.' },
  { code: 'COPYRIGHT_VIOLATION', label: 'Copyright Violation', description: 'Noi dung vi pham ban quyen.' },
  { code: 'OTHER', label: 'Other', description: 'Ly do khac can mo ta cu the.' },
];

const AdminPostsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = Math.max(0, Number(searchParams.get('page') || '0'));
  const initialSearch = searchParams.get('search') || '';
  const initialBlockedFilter = searchParams.get('status') || 'all';
  const initialMode = searchParams.get('mode') === 'reported' ? 'reported' : 'all';

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [page, setPage] = useState(initialPage);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState(initialSearch);
  const [blockedFilter, setBlockedFilter] = useState<string>(
    initialBlockedFilter === 'active' || initialBlockedFilter === 'blocked' ? initialBlockedFilter : 'all'
  );
  const [mode, setMode] = useState<'all' | 'reported'>(initialMode);
  const [reasonTemplates, setReasonTemplates] = useState<ModerationReasonTemplate[]>(FALLBACK_REASON_TEMPLATES);

  const [moderationModal, setModerationModal] = useState<{
    isOpen: boolean;
    action: ModerationAction;
    post: AdminPostItem | null;
  }>({
    isOpen: false,
    action: 'block',
    post: null,
  });

  const [reportDetailModal, setReportDetailModal] = useState<{
    isOpen: boolean;
    post: AdminPostItem | null;
    reports: PostReportResponse[];
    loading: boolean;
  }>({
    isOpen: false,
    post: null,
    reports: [],
    loading: false,
  });

  const [reasonCode, setReasonCode] = useState(FALLBACK_REASON_TEMPLATES[0].code);
  const [reasonDetail, setReasonDetail] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const blockedCount = useMemo(() => posts.filter((p) => p.isBlocked).length, [posts]);
  const resolvedCount = useMemo(() => posts.filter((p) => p.isResolved).length, [posts]);
  const reportedCount = useMemo(() => posts.filter((p) => (p.reportCount ?? 0) > 0).length, [posts]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];

    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  const parseBlockedFilter = (): boolean | undefined => {
    if (blockedFilter === 'blocked') return true;
    if (blockedFilter === 'active') return false;
    return undefined;
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = mode === 'reported'
        ? await adminApi.getAdminPostReportQueue(page, size, search || undefined, parseBlockedFilter())
        : await adminApi.getAdminPosts(page, size, search || undefined, parseBlockedFilter());

      if (data && 'content' in data) {
        const pageData = data as PageResponse<AdminPostItem>;
        setPosts(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
      } else {
        setPosts([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to fetch posts list');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReasonTemplates = async () => {
    try {
      const templates = await adminApi.getPostModerationReasonTemplates();
      if (templates?.length) {
        setReasonTemplates(templates);
        setReasonCode(templates[0].code);
      }
    } catch {
      setReasonTemplates(FALLBACK_REASON_TEMPLATES);
      setReasonCode(FALLBACK_REASON_TEMPLATES[0].code);
    }
  };

  const openReportDetailModal = async (post: AdminPostItem) => {
    setReportDetailModal({ isOpen: true, post, reports: [], loading: true });
    try {
      const reports = await adminApi.getAdminPostReports(post.id);
      setReportDetailModal({ isOpen: true, post, reports, loading: false });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to load report details');
      setReportDetailModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeReportDetailModal = () => {
    setReportDetailModal({ isOpen: false, post: null, reports: [], loading: false });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, blockedFilter, mode]);

  useEffect(() => {
    fetchReasonTemplates();
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (page > 0) nextParams.set('page', String(page));
    if (search.trim()) nextParams.set('search', search.trim());
    if (blockedFilter !== 'all') nextParams.set('status', blockedFilter);
    if (mode === 'reported') nextParams.set('mode', 'reported');
    setSearchParams(nextParams, { replace: true });
  }, [page, search, blockedFilter, mode, setSearchParams]);

  const openModerationModal = (action: ModerationAction, post: AdminPostItem) => {
    setModerationModal({ isOpen: true, action, post });
    setReasonCode(reasonTemplates[0]?.code || FALLBACK_REASON_TEMPLATES[0].code);
    setReasonDetail('');
  };

  const closeModerationModal = () => {
    setModerationModal({ isOpen: false, action: 'block', post: null });
    setReasonDetail('');
  };

  const submitModeration = async () => {
    if (!moderationModal.post) return;
    if (!reasonCode.trim()) {
      toast.error('Please choose a reason template');
      return;
    }
    if (!reasonDetail.trim()) {
      toast.error('Please enter moderation reason detail');
      return;
    }

    setSubmittingAction(true);
    try {
      const payload = { reasonCode, reasonDetail: reasonDetail.trim() };
      if (moderationModal.action === 'delete') {
        await adminApi.deleteAdminPost(moderationModal.post.id, payload);
        toast.success('Post deleted successfully');
      } else {
        await adminApi.toggleAdminPostBlock(moderationModal.post.id, payload);
        toast.success(moderationModal.post.isBlocked ? 'Post unblocked successfully' : 'Post blocked successfully');
      }
      closeModerationModal();
      fetchPosts();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to update post moderation status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getAuthorName = (post: AdminPostItem) => {
    return post.author?.username || 'Unknown author';
  };

  if (loading && posts.length === 0) {
    return (
      <div className="py-12 flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Posts Management"
        subtitle="Moderate discussion posts with report-priority queue and required reason templates."
        actions={
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setMode('all');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => {
                setMode('reported');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
                mode === 'reported' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FiFlag size={14} />
              <span>Report Queue</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 tablet:grid-cols-2 small_desktop:grid-cols-4 desktop:grid-cols-4 gap-6">
        <AdminStatCard title="Total Posts" value={totalElements} icon={<FiMessageSquare size={20} />} color="blue" />
        <AdminStatCard title="Blocked (Page)" value={blockedCount} icon={<FiSlash size={20} />} color="red" />
        <AdminStatCard title="Resolved (Page)" value={resolvedCount} icon={<FiCheckCircle size={20} />} color="green" />
        <AdminStatCard title="Reported (Page)" value={reportedCount} icon={<FiFlag size={20} />} color="indigo" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col small_desktop:flex-row desktop:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or content..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={blockedFilter}
                onChange={(e) => {
                  setBlockedFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="active">Visible</option>
                <option value="blocked">Blocked</option>
              </select>

              {(search || blockedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setBlockedFilter('all');
                    setPage(0);
                  }}
                  className="px-4 py-2 text-slate-500 hover:text-rose-600 font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <FiX /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Post</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Author</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reports</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiMessageSquare size={40} className="opacity-20" />
                      <p>No posts found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="max-w-[560px]">
                        <div className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {post.title}
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">
                          {post.content}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-[13px] font-semibold text-slate-700">{getAuthorName(post)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {post.isBlocked ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border text-rose-700 bg-rose-50 border-rose-100">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border text-emerald-700 bg-emerald-50 border-emerald-100">
                            Visible
                          </span>
                        )}
                        {post.isResolved && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border text-blue-700 bg-blue-50 border-blue-100">
                            Resolved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-[12px] text-slate-600 whitespace-nowrap">
                      {(post.reportCount ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => openReportDetailModal(post)}
                          className="flex flex-col items-start gap-1 text-left hover:text-blue-600 transition-colors"
                        >
                          <div className="text-rose-700 font-semibold underline decoration-dotted underline-offset-2">
                            {post.reportCount} reports
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {post.lastReportedAt ? new Date(post.lastReportedAt).toLocaleString() : '-'}
                          </div>
                        </button>
                      ) : (
                        <span className="text-slate-400">No report</span>
                      )}
                    </td>
                    <td className="p-4 text-[12px] text-slate-600 whitespace-nowrap">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip text="View details" position="top">
                          <Link
                            to={`/discuss/${post.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-transparent"
                          >
                            <FiExternalLink size={18} />
                          </Link>
                        </Tooltip>

                        <Tooltip text={post.isBlocked ? 'Unblock post' : 'Block post'} position="top">
                          <button
                            onClick={() => openModerationModal('block', post)}
                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors bg-transparent border-0 ${
                              post.isBlocked
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            {post.isBlocked ? <FiEye size={18} /> : <FiSlash size={18} />}
                          </button>
                        </Tooltip>

                        <Tooltip text="Delete post" position="top">
                          <button
                            onClick={() => openModerationModal('delete', post)}
                            className="inline-flex items-center justify-center p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors bg-transparent border-0"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-900">{posts.length}</span> of{' '}
            <span className="text-slate-900">{totalElements}</span> posts
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((s) => Math.max(0, s - 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {pageNumbers[0] && pageNumbers[0] > 0 && (
                <>
                  <button
                    onClick={() => setPage(0)}
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    1
                  </button>
                  <span className="px-1 text-slate-400 text-xs">...</span>
                </>
              )}

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === pageNumber
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber + 1}
                </button>
              ))}

              {pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <>
                  <span className="px-1 text-slate-400 text-xs">...</span>
                  <button
                    onClick={() => setPage(totalPages - 1)}
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              disabled={totalPages > 0 ? page >= totalPages - 1 : false}
              onClick={() => setPage((s) => s + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {moderationModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModerationModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="p-6 border-b border-slate-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <FiAlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {moderationModal.action === 'delete' ? 'Delete Post' : moderationModal.post?.isBlocked ? 'Unblock Post' : 'Block Post'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Provide standardized moderation reason. This reason will be sent to the post author.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-700">
                Post: <span className="font-semibold">{moderationModal.post?.title}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Reason Template
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                >
                  {reasonTemplates.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label} ({item.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Reason Detail
                </label>
                <textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  rows={4}
                  placeholder="Enter clear moderation reason for the author..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModerationModal}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                onClick={submitModeration}
                disabled={submittingAction}
                className={`px-4 py-2.5 text-sm font-semibold text-white rounded-lg ${
                  moderationModal.action === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {submittingAction
                  ? 'Processing...'
                  : moderationModal.action === 'delete'
                    ? 'Delete with Reason'
                    : moderationModal.post?.isBlocked
                      ? 'Unblock with Reason'
                      : 'Block with Reason'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportDetailModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeReportDetailModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                  <FiFlag size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">Report Details</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    All reports for <span className="font-semibold">{reportDetailModal.post?.title}</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {reportDetailModal.loading ? (
                <div className="py-20 flex justify-center">
                  <Loading />
                </div>
              ) : reportDetailModal.reports.length === 0 ? (
                <div className="py-20 text-center text-slate-500">No report details available.</div>
              ) : (
                <div className="space-y-4">
                  {reportDetailModal.reports.map((report) => (
                    <div key={report.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {report.reporterUsername || 'Unknown user'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}
                          </div>
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                          {report.reasonCode}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-700">
                        {report.reasonDetail || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={closeReportDetailModal}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPostsPage;
