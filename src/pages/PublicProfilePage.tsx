import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/Post/PostCard';
import { FiUserPlus, FiUserX, FiArrowLeft, FiUsers, FiFileText, FiMessageSquare, FiX } from 'react-icons/fi';
import { userApi } from '@/apis/user.api';
import { followApi } from '@/apis/follow.api';
import { conversationApi } from '@/apis/conversation.api';
import { postApi } from '@/apis/post.api';
import type { UserPublicProfileResponse } from '@/types/user.types';
import type { PostResponse } from '@/types/post.types';
import type { FollowResponse } from '@/types/follow.types';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type TabType = 'posts' | 'about' | 'stats';
type FollowModalTab = 'followers' | 'following';

const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserPublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<FollowModalTab>('followers');
  const [followUsers, setFollowUsers] = useState<FollowResponse[]>([]);
  const [loadingFollowUsers, setLoadingFollowUsers] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (profile && activeTab === 'posts') {
      fetchPosts();
    }
  }, [profile, activeTab]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const profileData = await userApi.getPublicProfile(Number(userId));
      setProfile(profileData);
      setIsFollowing(profileData.isFollowing);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải profile');
      navigate('/discuss');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!userId) return;
    
    try {
      setLoadingPosts(true);
      const response = await postApi.getPosts({
        authorId: Number(userId),
        page: 0,
        size: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      setPosts(response.content);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải bài viết');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleFollow = async () => {
    if (!userId || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isFollowing) {
        await followApi.unfollowUser(Number(userId));
        setIsFollowing(false);
        if (profile) {
          setProfile({ ...profile, followerCount: profile.followerCount - 1 });
        }
        toast.success('Đã bỏ theo dõi');
      } else {
        await followApi.followUser(Number(userId));
        setIsFollowing(true);
        if (profile) {
          setProfile({ ...profile, followerCount: profile.followerCount + 1 });
        }
        toast.success('Đã theo dõi');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMessage = async () => {
    if (!userId || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Tạo hoặc lấy DIRECT conversation với user này
      const conversation = await conversationApi.createOrGetDirectConversation(Number(userId));
      navigate(`/messages/${conversation.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo cuộc trò chuyện');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchFollowUsers = async (tab: FollowModalTab) => {
    if (!userId) return;

    try {
      setLoadingFollowUsers(true);
      const data =
        tab === 'followers'
          ? await followApi.getFollowers(Number(userId))
          : await followApi.getFollowing(Number(userId));
      setFollowUsers(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách theo dõi');
    } finally {
      setLoadingFollowUsers(false);
    }
  };

  const openFollowModal = async (tab: FollowModalTab) => {
    setFollowModalTab(tab);
    setIsFollowModalOpen(true);
    await fetchFollowUsers(tab);
  };

  const handleSwitchFollowTab = async (tab: FollowModalTab) => {
    if (tab === followModalTab) return;
    setFollowModalTab(tab);
    await fetchFollowUsers(tab);
  };

  const handleNavigateToPublicProfile = (targetUserId: number) => {
    setIsFollowModalOpen(false);
    navigate(`/users/${targetUserId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch {
      return 'Chưa cập nhật';
    }
  };

  if (loading) {
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

  const isOwnProfile = currentUser && currentUser.id === profile.userId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar
                src={profile.avatar || undefined}
                alt={profile.username}
                size="lg"
                className="w-24 h-24"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                  <button
                    onClick={() => openFollowModal('followers')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    <FiUsers className="mr-1" />
                    <span className="font-medium">{profile.followerCount}</span>
                    <span className="ml-1">người theo dõi</span>
                  </button>
                  <button
                    onClick={() => openFollowModal('following')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    <FiUsers className="mr-1" />
                    <span className="font-medium">{profile.followingCount}</span>
                    <span className="ml-1">đang theo dõi</span>
                  </button>
                  <div className="flex items-center">
                    <FiFileText className="mr-1" />
                    <span className="font-medium">{profile.postCount}</span>
                    <span className="ml-1">bài viết</span>
                  </div>
                </div>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleFollow}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <>
                      <FiUserX className="inline mr-2" />
                      Bỏ theo dõi
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="inline mr-2" />
                      Theo dõi
                    </>
                  )}
                </button>
                <button
                  onClick={handleMessage}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FiMessageSquare className="inline mr-2" />
                  Nhắn tin
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bài viết ({profile.postCount})
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Giới thiệu
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thống kê
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div>
                {loadingPosts ? (
                  <div className="text-center py-8 text-gray-500">Đang tải...</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Chưa có bài viết nào</div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Ngày sinh</h3>
                  <p className="text-gray-900">{formatDate(profile.dob)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Giới tính</h3>
                  <p className="text-gray-900">{profile.gender || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Tham gia</h3>
                  <p className="text-gray-900">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Bài viết</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.postCount}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Người theo dõi</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.followerCount}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Đang theo dõi</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.followingCount}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isFollowModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <button
              aria-label="Close follow modal"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFollowModalOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {followModalTab === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
                </h3>
                <button
                  onClick={() => setIsFollowModalOpen(false)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => handleSwitchFollowTab('followers')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    followModalTab === 'followers'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Người theo dõi ({profile.followerCount})
                </button>
                <button
                  onClick={() => handleSwitchFollowTab('following')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    followModalTab === 'following'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Đang theo dõi ({profile.followingCount})
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {loadingFollowUsers ? (
                  <div className="py-10 text-center text-gray-500">Đang tải danh sách...</div>
                ) : followUsers.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">Chưa có dữ liệu</div>
                ) : (
                  <div className="space-y-1">
                    {followUsers.map((item) => (
                      <button
                        key={`${followModalTab}-${item.userId}`}
                        onClick={() => handleNavigateToPublicProfile(item.userId)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <Avatar src={item.avatar || undefined} alt={item.username} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{item.username}</p>
                          <p className="text-xs text-gray-500">{followModalTab === 'followers' ? 'Đã theo dõi bạn' : 'Bạn đang theo dõi'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default PublicProfilePage;

