import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { adminApi } from '@/apis/admin.api';
import toast from 'react-hot-toast';
import type { UserManagementResponse } from '@/types/admin.types';
import type { PageResponse } from '@/types/common.types';
import { FiSearch, FiFilter, FiX, FiUserPlus, FiMoreVertical, FiShield, FiUserX, FiCheckCircle, FiUsers } from 'react-icons/fi';
import AdminStatCard from '@/components/Admin/AdminStatCard';
import AdminPageHeader from '@/components/Admin/AdminPageHeader';
import Tooltip from '@/components/Layout/Tooltip';
import ConfirmModal from '@/components/Modal/ConfirmModal';

const AdminUsersPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserManagementResponse[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ type: string; user: UserManagementResponse | null }>({ type: '', user: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: UserManagementResponse | null }>({
    isOpen: false,
    user: null
  });
  const [newRole, setNewRole] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(page, size, search || undefined, roleFilter || undefined, statusFilter || undefined);
      if (data && 'content' in data) {
        setUsers((data as PageResponse<UserManagementResponse>).content);
        setTotalPages((data as PageResponse<UserManagementResponse>).totalPages);
      } else {
        setUsers([]);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, roleFilter, statusFilter]);

  const handleBlock = async (user: UserManagementResponse) => {
    try {
      await adminApi.blockUser(user.id);
      toast.success('User blocked successfully');
      fetchUsers();
      setActionModal({ type: '', user: null });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblock = async (user: UserManagementResponse) => {
    try {
      await adminApi.unblockUser(user.id);
      toast.success('User unblocked successfully');
      fetchUsers();
      setActionModal({ type: '', user: null });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleChangeRole = async () => {
    if (!actionModal.user || !newRole) return;
    try {
      await adminApi.changeUserRole(actionModal.user.id, newRole);
      toast.success('Role updated successfully');
      fetchUsers();
      setActionModal({ type: '', user: null });
      setNewRole('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to change role');
    }
  };

  const handleDeleteClick = (user: UserManagementResponse) => {
    setDeleteModal({ isOpen: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;
    
    try {
      await adminApi.deleteUser(deleteModal.user.id);
      toast.success('User deleted successfully');
      fetchUsers();
      setDeleteModal({ isOpen: false, user: null });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete user');
      setDeleteModal({ isOpen: false, user: null });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      INACTIVE: 'bg-slate-50 text-slate-700 border-slate-100',
      BLOCKED: 'bg-rose-50 text-red-700 border-rose-100',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${colors[status as keyof typeof colors] || colors.INACTIVE}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      ROLE_ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      ROLE_USER: 'bg-blue-50 text-blue-700 border-blue-100',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${colors[role as keyof typeof colors] || colors.ROLE_USER}`}>
        {role.replace('ROLE_', '')}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="py-12 flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader 
        title="Users Management" 
        subtitle="Manage user accounts, roles, and status."
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-600/20">
            <FiUserPlus size={18} />
            <span>Invite User</span>
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 small_desktop:grid-cols-4 desktop:grid-cols-4 gap-6">
        <AdminStatCard title="Total Users" value={users.length * 5 + 120} icon={<FiUsers size={20} />} color="blue" trend={{ value: 12, isUp: true }} />
        <AdminStatCard title="Active Now" value={users.length * 2 + 15} icon={<FiCheckCircle size={20} />} color="green" trend={{ value: 5, isUp: true }} />
        <AdminStatCard title="Blocked" value={3} icon={<FiUserX size={20} />} color="red" trend={{ value: 2, isUp: false }} />
        <AdminStatCard title="Administrators" value={5} icon={<FiShield size={20} />} color="purple" />
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
                placeholder="Search by username or email..."
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
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm min-w-[140px]"
              >
                <option value="">All Roles</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_USER">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              {(search || roleFilter || statusFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('');
                    setStatusFilter('');
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
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Stats</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiUsers size={40} className="opacity-20" />
                      <p>No users found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm overflow-hidden">
                          {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.username}</div>
                          <div className="text-[12px] text-slate-500">{user.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4">{getStatusBadge(user.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-[13px] font-bold text-slate-900">{user.totalSubmissions}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">Subs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[13px] font-bold text-slate-900">{user.totalSolved}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">Solved</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip text="Change Role" position="top">
                          <button
                            onClick={() => {
                              setActionModal({ type: 'role', user });
                              setNewRole(user.role);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <FiShield size={18} />
                          </button>
                        </Tooltip>
                        {user.status === 'BLOCKED' ? (
                          <Tooltip text="Unblock User" position="top">
                            <button
                              onClick={() => handleUnblock(user)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip text="Block User" position="top">
                            <button
                              onClick={() => setActionModal({ type: 'block', user })}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <FiUserX size={18} />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip text="Delete User" position="top">
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <FiX size={18} />
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
            Showing <span className="text-slate-900">{users.length}</span> of <span className="text-slate-900">{totalPages * size}</span> users
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

      {/* Modals - Modernized */}
      {actionModal.type && actionModal.user && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-900">
                {actionModal.type === 'block' ? 'Block User' : actionModal.type === 'role' ? 'Change User Role' : 'Delete User'}
              </h3>
            </div>
            <div className="p-6">
              {actionModal.type === 'role' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Updating role for <span className="font-bold text-slate-900">@{actionModal.user.username}</span></p>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                  >
                    <option value="ROLE_USER">User (Standard Access)</option>
                    <option value="ROLE_ADMIN">Admin (Full System Access)</option>
                  </select>
                </div>
              ) : (
                <p className="text-slate-600">
                  Are you sure you want to {actionModal.type} user <span className="font-bold text-slate-900">@{actionModal.user.username}</span>?
                </p>
              )}
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-3 justify-end">
              <button
                onClick={() => setActionModal({ type: '', user: null })}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (actionModal.type === 'block') handleBlock(actionModal.user!);
                  else if (actionModal.type === 'role') handleChangeRole();
                }}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg ${
                  actionModal.type === 'block' 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                Confirm {actionModal.type.charAt(0).toUpperCase() + actionModal.type.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.user && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, user: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete User"
          message={`Are you sure you want to delete user "${deleteModal.user.username}"? This action is permanent and cannot be undone.`}
          confirmButtonText="Delete"
          confirmButtonColor="red"
        />
      )}
    </div>
  );
};

export default AdminUsersPage;

