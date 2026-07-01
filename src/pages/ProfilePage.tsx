import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import { ROUTES } from '@/utils/constants';
import { FiEdit2, FiMail, FiArrowLeft, FiPhone, FiCalendar, FiX, FiUser, FiBarChart2, FiUsers, FiUserPlus, FiLock } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { authApi } from '@/apis/auth.api';
import { followApi } from '@/apis/follow.api';
import { statisticsApi, type MyStatsResponse } from '@/apis/statistics.api';
import type { UserProfileResponse, UpdateProfileRequest } from '@/types/auth.types';
import type { FollowResponse } from '@/types/follow.types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';

type TabType = 'info' | 'stats' | 'following' | 'followers';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [following, setFollowing] = useState<FollowResponse[]>([]);
  const [followers, setFollowers] = useState<FollowResponse[]>([]);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [hasLoadedFollowing, setHasLoadedFollowing] = useState(false);
  const [hasLoadedFollowers, setHasLoadedFollowers] = useState(false);
  const [stats, setStats] = useState<MyStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [hasLoadedStats, setHasLoadedStats] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await authApi.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const fetchFollows = async () => {
      if (!user?.id || activeTab !== 'following' && activeTab !== 'followers') return;

      if (activeTab === 'following' && hasLoadedFollowing) return;
      if (activeTab === 'followers' && hasLoadedFollowers) return;
      
      setLoadingFollows(true);
      try {
        if (activeTab === 'following') {
          const data = await followApi.getFollowing(user.id);
          setFollowing(data);
          setHasLoadedFollowing(true);
        } else if (activeTab === 'followers') {
          const data = await followApi.getFollowers(user.id);
          setFollowers(data);
          setHasLoadedFollowers(true);
        }
      } catch (error) {
        console.error('Error fetching follows:', error);
        toast.error('Có lỗi xảy ra khi tải danh sách');
      } finally {
        setLoadingFollows(false);
      }
    };

    fetchFollows();
  }, [user?.id, activeTab, hasLoadedFollowing, hasLoadedFollowers]);

  useEffect(() => {
    const fetchStats = async () => {
      if (activeTab !== 'stats') return;
      if (hasLoadedStats) return;

      setLoadingStats(true);
      try {
        const data = await statisticsApi.getMyStats();
        setStats(data);
        setHasLoadedStats(true);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Không thể tải thống kê');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [activeTab, hasLoadedStats]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Container>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch {
      return 'Chưa cập nhật';
    }
  };

  const getStatusLabel = () => {
    if (profile.isBlocked) return 'Đã bị khóa';
    if (profile.status === false) return 'Đã tạm khóa';
    return 'Hoạt động';
  };

  const getStatusColor = () => {
    if (profile.isBlocked) return 'text-red-600 bg-red-50 border-red-200';
    if (profile.status === false) return 'text-gray-600 bg-gray-50 border-gray-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const handleEdit = (field: string, currentValue: string | null) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!editingField || !profile) return;

    try {
      const updateData: UpdateProfileRequest = {};
      
      if (editingField === 'username') {
        updateData.username = editValue.trim();
      } else if (editingField === 'phoneNumber') {
        updateData.phoneNumber = editValue.trim() || null;
      } else if (editingField === 'dob') {
        updateData.dob = editValue ? editValue : null;
      }

      const updatedProfile = await authApi.updateProfile(updateData);
      setProfile(updatedProfile);
      
      toast.success('Cập nhật thành công!');
      setEditingField(null);
      setEditValue('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const updatedProfile = await authApi.uploadAvatar(file);
      setProfile(updatedProfile);
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const renderFollowSkeleton = () => {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStatsSkeleton = () => {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-56 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl p-6 bg-gray-100">
              <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-3" />
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'info') {
      return (
        <div className="space-y-4">
          {/* Tên người dùng */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <FiEdit2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Tên người dùng</label>
              {editingField === 'username' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-900 truncate">{profile.username || 'Chưa có tên'}</p>
              )}
            </div>
            {editingField !== 'username' && (
              <button
                onClick={() => handleEdit('username', profile.username)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                title="Chỉnh sửa"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="p-3 bg-cyan-100 rounded-lg flex-shrink-0">
              <FiMail className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Email</label>
              <p className="text-lg font-semibold text-gray-900 truncate">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
              <FiPhone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Số điện thoại</label>
              {editingField === 'phoneNumber' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-900">{profile.phoneNumber || 'Chưa cập nhật'}</p>
              )}
            </div>
            {editingField !== 'phoneNumber' && (
              <button
                onClick={() => handleEdit('phoneNumber', profile.phoneNumber)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                title="Chỉnh sửa"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Ngày sinh */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="p-3 bg-pink-100 rounded-lg flex-shrink-0">
              <FiCalendar className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Ngày sinh</label>
              {editingField === 'dob' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-900">{formatDate(profile.dob)}</p>
              )}
            </div>
            {editingField !== 'dob' && (
              <button
                onClick={() => {
                  const dobValue = profile.dob 
                    ? new Date(profile.dob).toISOString().split('T')[0]
                    : '';
                  handleEdit('dob', dobValue);
                }}
                className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors flex-shrink-0"
                title="Chỉnh sửa"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Đổi mật khẩu */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
              <FiLock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-gray-500 mb-1 block">Mật khẩu</label>
              <p className="text-lg font-semibold text-gray-900">••••••••</p>
              <p className="text-xs text-gray-400 mt-1">Bảo mật tài khoản của bạn</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'stats') {
      if (loadingStats) {
        return renderStatsSkeleton();
      }

      if (!stats) {
        return <div className="text-center py-8 text-gray-500">Chưa có dữ liệu thống kê</div>;
      }

      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Thống kê hoạt động</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalSolved}</div>
              <div className="text-sm font-medium text-gray-600">Bài đã giải</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalSubmissions}</div>
              <div className="text-sm font-medium text-gray-600">Bài đã nộp</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{Math.round(stats.acceptanceRate)}%</div>
              <div className="text-sm font-medium text-gray-600">Tỷ lệ AC</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-emerald-600">{stats.solvedEasy}</div>
              <div className="text-xs text-gray-600">Easy đã giải</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-amber-600">{stats.solvedMedium}</div>
              <div className="text-xs text-gray-600">Medium đã giải</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-rose-600">{stats.solvedHard}</div>
              <div className="text-xs text-gray-600">Hard đã giải</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'following') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Đang theo dõi</h3>
          {loadingFollows ? (
            renderFollowSkeleton()
          ) : following.length > 0 ? (
            <div className="space-y-2">
              {following.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/users/${user.userId}`)}
                >
                  <Avatar src={user.avatar || undefined} alt={user.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 truncate">{user.username}</p>
                    <p className="text-sm text-gray-500">
                      Đã theo dõi từ {format(new Date(user.followedAt), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiUserPlus className="mx-auto mb-2 text-4xl text-gray-300" />
              <p>Bạn chưa theo dõi ai</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'followers') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Người theo dõi</h3>
          {loadingFollows ? (
            renderFollowSkeleton()
          ) : followers.length > 0 ? (
            <div className="space-y-2">
              {followers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/users/${user.userId}`)}
                >
                  <Avatar src={user.avatar || undefined} alt={user.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 truncate">{user.username}</p>
                    <p className="text-sm text-gray-500">
                      Đã theo dõi từ {format(new Date(user.followedAt), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiUsers className="mx-auto mb-2 text-4xl text-gray-300" />
              <p>Chưa có ai theo dõi bạn</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Quay lại</span>
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header Section - Avatar và Username */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {profile.avatar && profile.avatar.trim() ? (
                    <img 
                      src={profile.avatar} 
                      alt={(profile.username || profile.email) ?? 'Avatar'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gray-500">
                      {(profile.username || profile.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  title="Chỉnh sửa ảnh đại diện"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-sm">Đang tải...</div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.username || 'Chưa có tên'}
                  </h1>
                </div>
                <p className="text-gray-600">
                  CodeSphere ID: <span className="font-medium">{profile.username || profile.email}</span>
                </p>
                <div className={`inline-block mt-2 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor()}`}>
                  {getStatusLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Sidebar + Content */}
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'info'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FiUser className="w-5 h-5" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FiBarChart2 className="w-5 h-5" />
                  <span>Thống kê</span>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'following'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FiUserPlus className="w-5 h-5" />
                  <span>Đang theo dõi</span>
                </button>
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'followers'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FiUsers className="w-5 h-5" />
                  <span>Người theo dõi</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;
