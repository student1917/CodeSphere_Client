import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '@/components/Loading';
import { adminApi } from '@/apis/admin.api';
import toast from 'react-hot-toast';
import type { ContestResponse } from '@/types/contest.types';
import type { PageResponse } from '@/types/common.types';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiExternalLink, FiSearch, FiAward, FiClock, FiCheckCircle, FiX, FiUsers } from 'react-icons/fi';
import Tooltip from '@/components/Layout/Tooltip';
import AdminStatCard from '@/components/Admin/AdminStatCard';
import AdminPageHeader from '@/components/Admin/AdminPageHeader';
import ConfirmModal from '@/components/Modal/ConfirmModal';

const AdminContestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<ContestResponse[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contestId: number | null; contestTitle: string | null }>({
    isOpen: false,
    contestId: null,
    contestTitle: null
  });
  const navigate = useNavigate();

  const fetchContests = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getContests(page, size, search || undefined, typeFilter || undefined);
      if (data && 'content' in data) {
        const pageData = data as PageResponse<ContestResponse>;
        setContests(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      } else {
        setContests([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to fetch contests list');
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchContests();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, typeFilter]);

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteModal({ isOpen: true, contestId: id, contestTitle: title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.contestId) return;
    
    try {
      await adminApi.deleteContest(deleteModal.contestId);
      toast.success('Contest deleted');
      fetchContests();
      setDeleteModal({ isOpen: false, contestId: null, contestTitle: null });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete contest');
      setDeleteModal({ isOpen: false, contestId: null, contestTitle: null });
    }
  };

  const handleToggleVisibility = async (id: number, currentHidden: boolean) => {
    try {
      await adminApi.toggleContestVisibility(id);
      toast.success(currentHidden ? 'Contest is now visible' : 'Contest is now hidden');
      fetchContests();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      UPCOMING: 'bg-blue-50 text-blue-700 border-blue-100',
      REGISTRATION: 'bg-amber-50 text-amber-700 border-amber-100',
      ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      ENDED: 'bg-rose-50 text-rose-700 border-rose-100',
      AVAILABLE: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    };
    const labels: Record<string, string> = {
      UPCOMING: 'Upcoming',
      REGISTRATION: 'Registration',
      ONGOING: 'Ongoing',
      ENDED: 'Ended',
      AVAILABLE: 'Available',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${colors[status as keyof typeof colors] || colors.ENDED}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && contests.length === 0) {
    return (
      <div className="py-12 flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader 
        title="Contests Management" 
        subtitle="Schedule and manage competitive programming contests."
        actions={
          <button
            onClick={() => navigate('/admin/contests/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-600/20"
          >
            <FiPlus size={18} />
            <span>Create Contest</span>
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 small_desktop:grid-cols-4 desktop:grid-cols-4 gap-6">
        <AdminStatCard title="Total Contests" value={contests.length} icon={<FiAward size={20} />} color="blue" />
        <AdminStatCard title="Ongoing" value={contests.filter(c => c.status === 'ONGOING').length} icon={<FiClock size={20} />} color="green" />
        <AdminStatCard title="Registrations" value={contests.reduce((acc, c) => acc + (c.totalRegistrations || 0), 0)} icon={<FiUsers size={20} />} color="purple" />
        <AdminStatCard title="Completed" value={contests.filter(c => c.status === 'ENDED').length} icon={<FiCheckCircle size={20} />} color="emerald" />
      </div>

      {/* Filters and Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col small_desktop:flex-row desktop:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search contest by title..."
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
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm min-w-[140px]"
              >
                <option value="">All Types</option>
                <option value="OFFICIAL">Official Contest</option>
                <option value="PRACTICE">Practice</option>
              </select>
              {(search || typeFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('');
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contest Info</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Stats</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiAward size={40} className="opacity-20" />
                      <p>No contests found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contests.map((contest) => (
                  <tr key={contest.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {contest.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">ID: #{contest.id}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {contest.contestType === 'PRACTICE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                          Practice
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-wider">
                          Official
                        </span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(contest.status)}</td>
                    <td className="p-4">
                      {contest.contestType === 'PRACTICE' ? (
                        <div className="text-[12px] text-slate-600">
                          <span className="font-semibold">{contest.durationMinutes}</span> mins duration
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="font-bold text-slate-700">Start:</span>
                            {contest.startTime ? new Date(contest.startTime).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: false }) : 'N/A'}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="font-bold text-slate-700">End:</span>
                            {contest.endTime ? new Date(contest.endTime).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: false }) : 'N/A'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-[13px] font-bold text-slate-900">{contest.totalProblems}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">Problems</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[13px] font-bold text-slate-900">{contest.totalRegistrations}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">Regs</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip text="View Public" position="top">
                          <button
                            onClick={() => navigate(`/contest/${contest.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <FiExternalLink size={18} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Edit" position="top">
                          <button
                            onClick={() => navigate(`/admin/contests/${contest.id}/edit`)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <FiEdit size={18} />
                          </button>
                        </Tooltip>
                        <Tooltip text={contest.isHidden ? 'Make visible' : 'Hide contest'} position="top">
                          <button
                            onClick={() => handleToggleVisibility(contest.id, contest.isHidden || false)}
                            className={`p-2 rounded-lg transition-all ${
                              contest.isHidden 
                                ? 'text-emerald-500 hover:bg-emerald-50' 
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {contest.isHidden ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                          </button>
                        </Tooltip>
                        <Tooltip text="Delete" position="top">
                          <button
                            onClick={() => handleDeleteClick(contest.id, contest.title)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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

        {/* Pagination */}
        <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-900">{contests.length}</span> of <span className="text-slate-900">{totalElements}</span> contests
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
              {[...Array(Math.min(5, totalPages))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === i ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((s) => s + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.contestId && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, contestId: null, contestTitle: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Contest"
          message={`Are you sure you want to delete "${deleteModal.contestTitle}"? If this contest has registrations, the deletion will be blocked. This action is permanent and cannot be undone.`}
          confirmButtonText="Delete"
          confirmButtonColor="red"
        />
      )}
    </div>
  );
};

export default AdminContestsPage;

