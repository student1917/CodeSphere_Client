import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import PostCard from '@/components/Post/PostCard';
import Avatar from '@/components/Avatar';
import { FiPlus, FiTrendingUp, FiStar, FiSearch, FiX, FiUsers, FiFilter, FiHash } from 'react-icons/fi';
import { postApi } from '@/apis/post.api';
import { tagApi } from '@/apis/tag.api';
import { userApi } from '@/apis/user.api';
import { followApi } from '@/apis/follow.api';
import { useAuth } from '@/hooks/useAuth';
import type { PostResponse, TagResponse } from '@/types/post.types';
import type { UserSearchResponse } from '@/types/user.types';
import { ROUTES } from '@/utils/constants';
import toast from 'react-hot-toast';
import backgroundBlur from '@/assets/background/backgroundblur.jpg';

type SortType = 'votes' | 'newest';
type FilterType = 'all' | 'following';

const DiscussPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<TagResponse[]>([]);
  
  // Unified Search states
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<UserSearchResponse[]>([]);
  const [searchedPostsSuggestions, setSearchedPostsSuggestions] = useState<PostResponse[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [followingStatuses, setFollowingStatuses] = useState<Record<number, boolean>>({});
  const [processingFollow, setProcessingFollow] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchTags();
    
    // Click outside to close search results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortType, page, selectedTag, filterType, debouncedSearch]);

  // Unified Search logic
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    
    // Debounce for the main post list
    if (listSearchTimeout.current) clearTimeout(listSearchTimeout.current);
    listSearchTimeout.current = setTimeout(() => {
      setDebouncedSearch(val.trim());
      setPage(0);
    }, 600);

    // Debounce for dropdown suggestions
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.trim().length >= 2) {
      setShowSearchResults(true);
      searchTimeout.current = setTimeout(async () => {
        setLoadingSearch(true);
        try {
          // Parallel search for users and post suggestions
          const [userRes, postRes] = await Promise.all([
            userApi.searchUsers(val.trim(), 0, 3),
            postApi.getPosts({ search: val.trim(), size: 3 })
          ]);

          const filteredUsers = userRes.content.filter((u) => u.userId !== user?.id);
          setSearchedUsers(filteredUsers);
          setSearchedPostsSuggestions(postRes.content);
          
          if (user?.id && filteredUsers.length > 0) {
            const following = await followApi.getFollowing(user.id);
            const followingIds = new Set(following.map(f => f.userId));
            const statuses: Record<number, boolean> = {};
            filteredUsers.forEach((u) => {
              statuses[u.userId] = followingIds.has(u.userId);
            });
            setFollowingStatuses(statuses);
          }
        } catch (error) {
          console.error('Error in unified search:', error);
        } finally {
          setLoadingSearch(false);
        }
      }, 400);
    } else {
      setSearchedUsers([]);
      setSearchedPostsSuggestions([]);
      setShowSearchResults(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    if (processingFollow === userId) return;
    
    setProcessingFollow(userId);
    try {
      const isFollowing = followingStatuses[userId];
      if (isFollowing) {
        await followApi.unfollowUser(userId);
        setFollowingStatuses({ ...followingStatuses, [userId]: false });
        toast.success('Unfollowed');
      } else {
        await followApi.followUser(userId);
        setFollowingStatuses({ ...followingStatuses, [userId]: true });
        toast.success('Followed');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'An error occurred');
    } finally {
      setProcessingFollow(null);
    }
  };

  const fetchTags = async () => {
    try {
      const tagsData = await tagApi.getAllTags('POST');
      setTags(tagsData);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postApi.getPosts({
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC',
        tag: selectedTag || undefined,
        search: debouncedSearch || undefined,
        followedOnly: filterType === 'following' ? true : undefined,
      });
      
      let sortedPosts = response.content;
      if (sortType === 'votes') {
        sortedPosts = [...response.content].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      }
      
      if (page === 0) {
        setPosts(sortedPosts);
      } else {
        setPosts((prev) => [...prev, ...sortedPosts]);
      }
      
      setHasMore(response.number < response.totalPages - 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort: SortType) => {
    setSortType(newSort);
    setPage(0);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleTagFilter = (tagSlug: string | null) => {
    setSelectedTag(tagSlug);
    setPage(0);
  };

  const clearFilters = () => {
    if (listSearchTimeout.current) clearTimeout(listSearchTimeout.current);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSelectedTag(null);
    setSearchQuery('');
    setDebouncedSearch('');
    setSearchedUsers([]);
    setSearchedPostsSuggestions([]);
    setShowSearchResults(false);
    setFilterType('all');
    setPage(0);
  };

  return (
    <div 
      className="min-h-screen relative bg-gray-100"
      style={{
        backgroundImage: `url(${backgroundBlur})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gray-100/60 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 tablet:px-6 small_desktop:px-8 desktop:px-10">
        <div className="grid grid-cols-1 tablet:grid-cols-12 small_desktop:grid-cols-12 desktop:grid-cols-12 gap-6 py-6 items-start">
          
          {/* LEFT SIDEBAR - Navigation & Filters */}
          <div className="hidden tablet:block small_desktop:block desktop:block tablet:col-span-4 small_desktop:col-span-3 desktop:col-span-3 space-y-4 sticky top-[80px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Discuss</h2>
                <button
                  onClick={() => navigate(ROUTES.CREATE_POST)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Create new post"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1 mb-6">
                <button
                  onClick={() => { setFilterType('all'); setPage(0); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold transition-colors ${
                    filterType === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiUsers className="w-5 h-5" />
                  <span>All posts</span>
                </button>
                {user && (
                  <button
                    onClick={() => { setFilterType('following'); setPage(0); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold transition-colors ${
                      filterType === 'following' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FiUsers className="w-5 h-5" />
                    <span>Following</span>
                  </button>
                )}
              </nav>

              {/* Sort Options */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">Sort by</h3>
                <div className="flex gap-2 px-1">
                  <button
                    onClick={() => handleSortChange('newest')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${
                      sortType === 'newest' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FiStar className="w-4 h-4" />
                    <span>Newest</span>
                  </button>
                  <button
                    onClick={() => handleSortChange('votes')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${
                      sortType === 'votes' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FiTrendingUp className="w-4 h-4" />
                    <span>Trending</span>
                  </button>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <div className="flex items-center justify-between mb-3 px-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Popular Tags</h3>
                  {selectedTag && (
                    <button onClick={() => handleTagFilter(null)} className="text-xs text-blue-600 hover:underline">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {tags.slice(0, 12).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagFilter(selectedTag === tag.slug ? null : tag.slug)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedTag === tag.slug
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
                </div>

          {/* MAIN CONTENT - Feed */}
          <div className="tablet:col-span-8 small_desktop:col-span-6 desktop:col-span-6 space-y-4 max-w-[720px] tablet:mx-0 small_desktop:mx-auto desktop:mx-auto w-full">
            
            {/* Unified Search & Create Post */}
            <div className="space-y-4">
              {/* Unified Search Bar */}
              <div className="relative" ref={searchRef}>
              <div className="relative group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search posts or users..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                      {searchQuery && (
                        <button
                      onClick={() => {
                        if (listSearchTimeout.current) clearTimeout(listSearchTimeout.current);
                        if (searchTimeout.current) clearTimeout(searchTimeout.current);
                        setSearchQuery('');
                        setDebouncedSearch('');
                        setSearchedUsers([]);
                        setSearchedPostsSuggestions([]);
                        setPage(0);
                        setShowSearchResults(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[100] max-h-[480px] overflow-y-auto">
                    {loadingSearch ? (
                      <div className="p-8 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        {/* Users Section */}
                        {searchedUsers.length > 0 && (
                          <div className="p-2 border-b border-gray-100">
                            <h4 className="text-[13px] font-bold text-gray-500 px-3 py-2 flex items-center gap-2">
                              <FiUsers className="w-4 h-4" /> Users
                            </h4>
                            {searchedUsers.map((u) => (
                              <div
                                key={u.userId}
                                onClick={() => navigate(`/users/${u.userId}`)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar src={u.avatar || undefined} alt={u.username} size="md" />
                                  <span className="font-semibold text-gray-900 group-hover:text-blue-600">{u.username}</span>
                                </div>
                                <button
                                  onClick={(e) => handleFollow(e, u.userId)}
                                  disabled={processingFollow === u.userId}
                                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                    followingStatuses[u.userId]
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {followingStatuses[u.userId] ? 'Following' : 'Follow'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Posts Section */}
                        {searchedPostsSuggestions.length > 0 && (
                          <div className="p-2 border-b border-gray-100">
                            <h4 className="text-[13px] font-bold text-gray-500 px-3 py-2 flex items-center gap-2">
                              <FiFilter className="w-4 h-4" /> Posts
                            </h4>
                            {searchedPostsSuggestions.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => navigate(`/discuss/${p.id}`)}
                                className="flex flex-col p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                              >
                                <span className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">{p.title}</span>
                                <span className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                  <span>{p.authorName}</span>
                                  <span>•</span>
                                  <span>{p.upvotes} likes</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* All Results Suggestion */}
                        <div className="p-2">
                          <h4 className="text-[13px] font-bold text-gray-500 px-3 py-2 flex items-center gap-2">
                            <FiSearch className="w-4 h-4" /> See results for
                          </h4>
                          <div 
                            className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => { 
                              setShowSearchResults(false); 
                              setDebouncedSearch(searchQuery.trim());
                              setPage(0);
                            }}
                          >
                            <p className="text-sm text-gray-700">Search posts for "<span className="font-bold">{searchQuery}</span>"</p>
                          </div>
                        </div>

                        {searchedUsers.length === 0 && searchedPostsSuggestions.length === 0 && !loadingSearch && (
                          <div className="p-8 text-center text-gray-500 text-sm">
                            No results found
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Create Post Entry (Facebook Style) */}
              {user && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                  <Avatar src={user.avatar || undefined} size="md" />
                  <button
                    onClick={() => navigate(ROUTES.CREATE_POST)}
                    className="flex-1 text-left px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 text-[15px] transition-colors"
                  >
                    {user.username}, what's on your mind?
                  </button>
                </div>
              )}
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {loading && posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No posts found</h3>
                  <p className="text-gray-500">Try changing filters or search keywords.</p>
                  <button onClick={clearFilters} className="mt-4 text-blue-600 font-bold hover:underline">Clear all filters</button>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="pt-4 pb-8 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-8 py-2.5 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                      >
                        {loading ? 'Loading more...' : 'Load more posts'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Potential for Suggested Topics/Users */}
          <div className="hidden small_desktop:block desktop:block small_desktop:col-span-3 desktop:col-span-3 space-y-4 sticky top-[80px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">Community Rules</h3>
              <ul className="space-y-3 text-[14px] text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Respect everyone and avoid personal attacks.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Do not post spam or unauthorized advertisements.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Use tags appropriately for the post's purpose.</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100 text-[12px] text-gray-400">
                © 2025 CodeSphere. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussPage;

