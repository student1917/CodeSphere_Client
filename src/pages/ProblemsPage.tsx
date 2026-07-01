import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import { problemApi } from '@/apis/problem.api';
import { categoryApi } from '@/apis/category.api';
import { ROUTES } from '@/utils/constants';
import type { ProblemResponse } from '@/types/problem.types';
import type { CategoryResponse } from '@/types/common.types';
import { 
  FiSearch, 
  FiChevronDown, 
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiDatabase,
  FiTerminal,
  FiCpu,
  FiCode,
  FiBarChart2,
  FiStar
} from 'react-icons/fi';
import bannerProblem from '@/assets/Banner_Problem.png';
import RecommendationList from '@/components/Recommendation/RecommendationList';

const ProblemsPage = () => {
  const [searchParams] = useSearchParams();
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const difficultyDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Statistics states - removed unused states

  // Bookmarked problems list (My List)
  const [bookmarkedProblems, setBookmarkedProblems] = useState<ProblemResponse[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [bookmarkingProblemIds, setBookmarkingProblemIds] = useState<Set<number>>(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const difficulties = [
    { value: '', label: 'All' },
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
  ];

  const statuses = [
    { value: '', label: 'All' },
    { value: 'NOT_ATTEMPTED', label: 'Not Attempted' },
    { value: 'ATTEMPTED_NOT_COMPLETED', label: 'Attempted' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const getStatusLabel = () => {
    const status = statuses.find(s => s.value === selectedStatus);
    return status ? status.label : 'Status';
  };

  // Topic icons mapping
  const getTopicIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('algorithm')) return <FiCpu className="w-4 h-4 text-orange-500" />;
    if (name.includes('database')) return <FiDatabase className="w-4 h-4 text-blue-500" />;
    if (name.includes('shell')) return <FiTerminal className="w-4 h-4 text-green-500" />;
    if (name.includes('concurrency')) return <FiCode className="w-4 h-4 text-purple-500" />;
    if (name.includes('javascript') || name.includes('js')) return <FiCode className="w-4 h-4 text-blue-400" />;
    if (name.includes('pandas') || name.includes('data')) return <FiBarChart2 className="w-4 h-4 text-purple-600" />;
    return <FiFolder className="w-4 h-4 text-gray-500" />;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (difficultyDropdownRef.current && !difficultyDropdownRef.current.contains(event.target as Node)) {
        setIsDifficultyOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    };

    if (isDifficultyOpen || isStatusOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDifficultyOpen, isStatusOpen]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await categoryApi.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch statistics (solved count only)
  // Note: totalProblems will be updated from the problems list response
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Get user stats (solved count) - currently not displayed
        // const stats = await statisticsApi.getMyStats();
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Keep default value (0) if API fails
      }
    };

    fetchStatistics();
  }, []);

  // Fetch problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setIsLoading(true);
        const params: any = {
          page: currentPage,
          size: 50,
          sortBy: 'createdAt',
          sortDir: 'DESC',
        };

        if (searchQuery) params.search = searchQuery;
        if (selectedDifficulty) params.level = selectedDifficulty;
        if (selectedTopic && selectedTopic !== 'all') {
          params.category = selectedTopic;
        }

        const response = await problemApi.getProblems(params);
        let filteredProblems = response.content;

        // Filter by status at frontend
        if (selectedStatus) {
          filteredProblems = filteredProblems.filter(problem => {
            if (selectedStatus === 'COMPLETED') return problem.status === 'COMPLETED';
            if (selectedStatus === 'ATTEMPTED_NOT_COMPLETED') return problem.status === 'ATTEMPTED_NOT_COMPLETED';
            if (selectedStatus === 'NOT_ATTEMPTED') return !problem.status || problem.status === 'NOT_ATTEMPTED';
            return true;
          });
        }

        console.log('=== Problems List Debug ===');
        console.log('Problems in response.content:', response.content.length);
        console.log('Response totalElements:', response.totalElements);
        console.log('Response totalPages:', response.totalPages);
        console.log('Filtered problems:', filteredProblems.length);
        console.log('Selected status filter:', selectedStatus);

        setProblems(filteredProblems);
        setTotalPages(response.totalPages);
        
        // Update totalProblems from the actual response
        // This ensures totalProblems matches what backend actually returns
        // Note: If status filter is applied, totalElements might not reflect filtered count
        // But we use totalElements as the base total (before frontend status filtering)
        // setTotalProblems(response.totalElements); // Not used currently
      } catch (error) {
        console.error('Error fetching problems:', error);
        setProblems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, [currentPage, searchQuery, selectedDifficulty, selectedTopic, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      EASY: 'text-green-600 bg-green-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      HARD: 'text-red-600 bg-red-50',
    };
    const labels = {
      EASY: 'Easy',
      MEDIUM: 'Medium',
      HARD: 'Hard',
    };
    return (
      <span className={`px-2.5 py-1 rounded text-xs font-medium ${colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-50'}`}>
        {labels[level as keyof typeof labels] || level}
      </span>
    );
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'COMPLETED') {
      return <FiCheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (status === 'ATTEMPTED_NOT_COMPLETED') {
      return <FiClock className="w-4 h-4 text-yellow-500" />;
    }
    return null;
  };

  // Clean title - remove code prefix if exists
  const getCleanTitle = (title: string, code?: string) => {
    if (!code) return title;
    // If title starts with code, remove it
    const codePrefix = `${code}. `;
    if (title.startsWith(codePrefix)) {
      return title.substring(codePrefix.length);
    }
    return title;
  };

  // Fetch bookmarked problems
  const fetchBookmarkedProblems = async () => {
    try {
      setIsLoadingBookmarks(true);
      const response = await problemApi.getProblems({
        page: 0,
        size: 50,
        bookmarkStatus: 'bookmarked',
      });
      setBookmarkedProblems(response.content);
    } catch (error) {
      console.error('Error fetching bookmarked problems:', error);
      setBookmarkedProblems([]);
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  // Fetch bookmarked problems on mount
  useEffect(() => {
    fetchBookmarkedProblems();
  }, []);

  const handleToggleBookmark = async (e: React.MouseEvent, problemId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double click / multiple requests
    if (bookmarkingProblemIds.has(problemId)) {
      return;
    }
    
    // Add to loading set
    setBookmarkingProblemIds(prev => new Set(prev).add(problemId));
    
    try {
      const response = await problemApi.toggleBookmark(problemId);
      
      // Update the problem in the main list
      setProblems(prevProblems => 
        prevProblems.map(problem => 
          problem.id === problemId 
            ? { ...problem, isBookmarked: response.isBookmarked }
            : problem
        )
      );

      // Update bookmarked list
      if (response.isBookmarked) {
        // Add to bookmarked list - find the problem from main list
        const problem = problems.find(p => p.id === problemId);
        if (problem) {
          setBookmarkedProblems(prev => {
            // Check if already exists
            if (prev.some(p => p.id === problemId)) return prev;
            return [...prev, { ...problem, isBookmarked: true }];
          });
        } else {
          // If not in main list, fetch it
          fetchBookmarkedProblems();
        }
      } else {
        // Remove from bookmarked list
        setBookmarkedProblems(prev => prev.filter(p => p.id !== problemId));
      }
      
      toast.success(response.message);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error bookmarking problem';
      toast.error(message);
      console.error('Bookmark error:', error);
    } finally {
      // Remove from loading set
      setBookmarkingProblemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(problemId);
        return newSet;
      });
    }
  };


  return (
    <div className="min-h-screen bg-white">
      <Container>
        <div className="pt-8">
          {/* Banner */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-7xl">
              <img
                src={bannerProblem}
                alt="Problems Banner"
                className="w-full h-auto rounded-lg object-cover"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="mb-6">
            <RecommendationList limit={5} />
          </div>

        {/* Topic Filters - Top Section */}
        <div className="py-6 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTopic === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M8 11a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
              </svg>
              All Topics
            </button>
            {!isLoadingCategories && categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedTopic(category.slug || 'all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTopic === (category.slug || 'all')
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTopicIcon(category.name)}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="py-4 flex items-center gap-4 flex-wrap">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Difficulty Filter */}
          <div className="relative" ref={difficultyDropdownRef}>
            <button
              onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <FiChevronDown className={`w-4 h-4 transition-transform ${isDifficultyOpen ? 'rotate-180' : ''}`} />
              <span className="text-sm font-medium">Difficulty</span>
            </button>
            {isDifficultyOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => {
                      setSelectedDifficulty(difficulty.value);
                      setIsDifficultyOpen(false);
                      setCurrentPage(0);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedDifficulty === difficulty.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <FiChevronDown className={`w-4 h-4 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              <span className="text-sm font-medium">{getStatusLabel()}</span>
            </button>
            {isStatusOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      setSelectedStatus(status.value);
                      setIsStatusOpen(false);
                      setCurrentPage(0);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                      selectedStatus === status.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {status.value === 'COMPLETED' && <FiCheckCircle className="w-4 h-4 text-green-500" />}
                    {status.value === 'ATTEMPTED_NOT_COMPLETED' && <FiClock className="w-4 h-4 text-yellow-500" />}
                    {status.value === 'NOT_ATTEMPTED' && <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>}
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6">
          {/* Problems List - Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : problems.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">No problems found</p>
              </div>
            ) : (
              <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                {problems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className={`group flex items-start gap-4 px-6 py-5 hover:bg-gray-50 transition-all ${
                      index !== problems.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    {/* Status Icon - luôn có để giữ layout đồng nhất */}
                    <div className="flex-shrink-0 pt-1 w-5 h-5 flex items-center justify-center">
                      {problem.status === 'COMPLETED' && (
                        <FiCheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    {/* Main Content */}
                    <Link
                      to={`${ROUTES.PROBLEMS}/${problem.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <div className="mb-2">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {getCleanTitle(problem.title, problem.code)}
                            </h3>
                            {problem.isPublic === false && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                                Contest-only
                              </span>
                            )}
                          </div>

                          {/* Topics/Categories */}
                          {problem.categories && problem.categories.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {problem.categories.slice(0, 3).map((category) => (
                                <span
                                  key={category.id}
                                  className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  {category.name}
                                </span>
                              ))}
                              {problem.categories.length > 3 && (
                                <span className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-500">
                                  +{problem.categories.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Side Info */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Difficulty Badge */}
                          {getLevelBadge(problem.level)}
                        </div>
                      </div>
                    </Link>

                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => handleToggleBookmark(e, problem.id)}
                      disabled={bookmarkingProblemIds.has(problem.id)}
                      className="flex-shrink-0 p-2 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={problem.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                      <FiStar 
                        className={`w-5 h-5 transition-colors ${
                          problem.isBookmarked 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* My List Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiStar className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  My List
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {bookmarkedProblems.length} bài đã đánh dấu
                </p>
              </div>
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {isLoadingBookmarks ? (
                  <div className="flex justify-center py-8">
                    <Loading />
                  </div>
                ) : bookmarkedProblems.length === 0 ? (
                  <div className="text-center py-8">
                    <FiStar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Chưa có bài nào được đánh dấu</p>
                    <p className="text-xs text-gray-400 mt-1">Click vào icon sao để thêm vào danh sách</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookmarkedProblems.map((problem) => (
                      <Link
                        key={problem.id}
                        to={`${ROUTES.PROBLEMS}/${problem.id}`}
                        className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                              {getCleanTitle(problem.title, problem.code)}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              {getLevelBadge(problem.level)}
                              {getStatusIcon(problem.status)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleBookmark(e, problem.id);
                            }}
                            disabled={bookmarkingProblemIds.has(problem.id)}
                            className="p-1 hover:bg-yellow-100 rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Bỏ đánh dấu sao"
                          >
                            <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

      </Container>
    </div>
  );
};

export default ProblemsPage;

