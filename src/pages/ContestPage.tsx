import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import { contestApi } from '@/apis/contest.api';
import toast from 'react-hot-toast';
import type { ContestResponse } from '@/types/contest.types';
import type { PageResponse } from '@/types/common.types';
import { FiSearch, FiClock, FiUsers, FiFileText, FiLock } from 'react-icons/fi';
import bannerChungKet from '@/assets/background/Banner_chung_ket.png';

type TabType = 'PRACTICE' | 'OFFICIAL' | 'PRIVATE';

const ContestPage = () => {
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<ContestResponse[]>([]);
  const [allContests, setAllContests] = useState<ContestResponse[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [activeTab, setActiveTab] = useState<TabType>('PRACTICE');
  const [practiceFilter, setPracticeFilter] = useState<'ALL' | 'DONE' | 'NOT_DONE'>('ALL');
  const [officialFilter, setOfficialFilter] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'ENDED'>('ALL');
  const [search, setSearch] = useState('');
  const [privateCode, setPrivateCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchContests = async () => {
    setLoading(true);
    try {
      let allContestsData: ContestResponse[] = [];
      
      if (activeTab === 'PRIVATE') {
        // Tab PRIVATE: chỉ fetch private contests (isPublic = false)
        // Backend sẽ tự động filter chỉ trả về những contest user đã register
        const practicePrivateData = await contestApi.getContests(
          page, 
          size * 2,
          false, // isPublic = false (chỉ lấy private)
          undefined,
          'PRACTICE'
        );
        
        const officialPrivateData = await contestApi.getContests(
          page, 
          size * 2,
          false, // isPublic = false (chỉ lấy private)
          undefined,
          'OFFICIAL'
        );
        
        if (practicePrivateData && 'content' in practicePrivateData) {
          allContestsData.push(...(practicePrivateData as PageResponse<ContestResponse>).content);
        }
        if (officialPrivateData && 'content' in officialPrivateData) {
          allContestsData.push(...(officialPrivateData as PageResponse<ContestResponse>).content);
        }
      } else {
        // Tab PRACTICE/OFFICIAL: chỉ fetch public contests
        const practiceData = await contestApi.getContests(
          page, 
          size * 2,
          true, // isPublic = true (chỉ lấy public)
          undefined,
          'PRACTICE'
        );
        
        const officialData = await contestApi.getContests(
          page, 
          size * 2,
          true, // isPublic = true (chỉ lấy public)
          undefined,
          'OFFICIAL'
        );
        
        if (practiceData && 'content' in practiceData) {
          allContestsData.push(...(practiceData as PageResponse<ContestResponse>).content);
        }
        if (officialData && 'content' in officialData) {
          allContestsData.push(...(officialData as PageResponse<ContestResponse>).content);
        }
      }
      
      setAllContests(allContestsData);
      applyFilters(allContestsData);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to fetch contests');
      setAllContests([]);
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (contestsToFilter?: ContestResponse[]) => {
    const source = contestsToFilter || allContests;
    if (source.length === 0) {
      setContests([]);
      return;
    }

    let filtered = [...source];

    // Filter by tab
    if (activeTab === 'PRACTICE') {
      filtered = filtered.filter(c => c.contestType === 'PRACTICE');
      
      // Filter by practice status
      if (practiceFilter === 'DONE') {
        filtered = filtered.filter(c => c.isRegistered);
      } else if (practiceFilter === 'NOT_DONE') {
        filtered = filtered.filter(c => !c.isRegistered);
      }
    } else if (activeTab === 'OFFICIAL') {
      filtered = filtered.filter(c => c.contestType === 'OFFICIAL');
      
      // Filter by official status
      if (officialFilter === 'UPCOMING') {
        filtered = filtered.filter(c => c.status === 'UPCOMING');
      } else if (officialFilter === 'ONGOING') {
        filtered = filtered.filter(c => c.status === 'ONGOING');
      } else if (officialFilter === 'ENDED') {
        filtered = filtered.filter(c => c.status === 'ENDED');
      }
    } else if (activeTab === 'PRIVATE') {
      // Private contests: chỉ hiển thị contests đã register (isPublic = false và đã register)
      filtered = filtered.filter(c => !c.isPublic && c.hasAccessCode && c.isRegistered);
    }

    // Apply search filter (only for PRACTICE and OFFICIAL tabs)
    if (activeTab !== 'PRIVATE' && search.trim()) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setContests(filtered);
  };

  useEffect(() => {
    fetchContests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab]);

  useEffect(() => {
    if (allContests.length > 0) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, practiceFilter, officialFilter, search, privateCode, allContests]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      UPCOMING: { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
      REGISTRATION: { text: 'Registration', color: 'bg-yellow-100 text-yellow-800' },
      ONGOING: { text: 'Ongoing', color: 'bg-green-100 text-green-800' },
      ENDED: { text: 'Ended', color: 'bg-gray-100 text-gray-800' },
      AVAILABLE: { text: 'Available', color: 'bg-purple-100 text-purple-800' },
    };
    
    const statusInfo = statusMap[status] || statusMap.ENDED;
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleVerifyCode = async () => {
    if (!privateCode.trim()) {
      toast.error('Please enter an access code');
      return;
    }
    
    setVerifying(true);
    try {
      const contest = await contestApi.verifyAccessCode(privateCode.trim());
      toast.success(`Access granted! Contest "${contest.title}" is now available.`);
      setPrivateCode('');
      // Refresh contests to include the newly verified contest
      await fetchContests();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Invalid access code');
    } finally {
      setVerifying(false);
    }
  };

  const getPracticeStatusBadge = (isRegistered: boolean) => {
    if (isRegistered) {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          Done
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          Not Done
        </span>
      );
    }
  };

  const getContestTypeBadge = (contestType: 'PRACTICE' | 'OFFICIAL') => {
    if (contestType === 'PRACTICE') {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
          Practice
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
          Official
        </span>
      );
    }
  };

  if (loading && contests.length === 0) {
    return (
      <Container>
        <div className="py-12">
          <Loading />
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Container>
        <div className="pt-8">
          {/* Banner */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-7xl">
              <img
                src={bannerChungKet}
                alt="Contest Banner"
                className="w-full h-auto rounded-lg object-cover"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Header - Sticky */}
          <div className="sticky top-0 z-10 bg-white pb-6 mb-6 border-b border-gray-200 shadow-sm">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Contest</h1>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('PRACTICE');
                setPracticeFilter('ALL');
                setSearch('');
                setPage(0);
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'PRACTICE'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => {
                setActiveTab('OFFICIAL');
                setOfficialFilter('ALL');
                setSearch('');
                setPage(0);
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'OFFICIAL'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Official
            </button>
            <button
              onClick={async () => {
                setActiveTab('PRIVATE');
                setPrivateCode('');
                setPage(0);
                // Refresh contests when switching to PRIVATE tab to get only registered private contests
                await fetchContests();
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'PRIVATE'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Private
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            {activeTab === 'PRIVATE' ? (
              <div className="relative flex-1 max-w-md flex gap-2">
                <div className="relative flex-1">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter private contest access code..."
                    value={privateCode}
                    onChange={(e) => setPrivateCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && privateCode.trim()) {
                        handleVerifyCode();
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={handleVerifyCode}
                  disabled={!privateCode.trim() || verifying}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            ) : (
              <>
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {activeTab === 'PRACTICE' ? (
                  <select
                    value={practiceFilter}
                    onChange={(e) => {
                      setPracticeFilter(e.target.value as 'ALL' | 'DONE' | 'NOT_DONE');
                      setPage(0);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All</option>
                    <option value="DONE">Done</option>
                    <option value="NOT_DONE">Not Done</option>
                  </select>
                ) : (
                  <select
                    value={officialFilter}
                    onChange={(e) => {
                      setOfficialFilter(e.target.value as 'ALL' | 'UPCOMING' | 'ONGOING' | 'ENDED');
                      setPage(0);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ALL">All</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="ENDED">Ended</option>
                  </select>
                )}
              </>
            )}
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto -mx-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {contests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              {activeTab === 'PRIVATE' ? (
                <div className="space-y-4">
                  <FiLock className="mx-auto mb-3 text-4xl text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">No private contests available</p>
                  <p className="text-sm text-gray-500">Enter an access code above to unlock private contests</p>
                </div>
              ) : (
                <div className="text-gray-500">No contests found</div>
              )}
            </div>
          ) : (
            contests.map((contest) => {
              const isPractice = contest.contestType === 'PRACTICE';
              const borderColor = isPractice 
                ? 'border-l-indigo-500 hover:border-l-indigo-600' 
                : 'border-l-orange-500 hover:border-l-orange-600';
              const titleColor = isPractice ? 'text-indigo-700' : 'text-orange-700';
              
              return (
                <Link
                  key={contest.id}
                  to={`/contest/${contest.id}`}
                  className={`group bg-white rounded-lg shadow-sm border-l-2 ${borderColor} p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`text-lg font-semibold ${titleColor} flex-1 group-hover:underline line-clamp-1`}>
                      {contest.title}
                    </h3>
                    <div className="flex flex-col gap-1 ml-2">
                      {getContestTypeBadge(contest.contestType)}
                      {isPractice 
                        ? getPracticeStatusBadge(contest.isRegistered)
                        : getStatusBadge(contest.status)
                      }
                    </div>
                  </div>
                  
                  {contest.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-snug">
                      {contest.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {isPractice ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs">
                          <FiClock className="text-indigo-500 text-sm" />
                          <span className="text-gray-700">
                            Duration: <span className="text-indigo-600 font-semibold">{contest.durationMinutes} min</span>
                          </span>
                        </div>
                        <div className="text-xs text-indigo-400 italic">
                          You can start anytime
                        </div>
                      </>
                    ) : (
                      <>
                        {contest.startTime && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <FiClock className="text-orange-500 text-sm" />
                            <span className="text-gray-700">
                              Start: <span className="text-orange-600 font-medium">
                                {new Date(contest.startTime).toLocaleString('vi-VN', { hour12: false })}
                              </span>
                            </span>
                          </div>
                        )}
                        {contest.endTime && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <FiClock className="text-orange-500 text-sm" />
                            <span className="text-gray-700">
                              End: <span className="text-orange-600 font-medium">
                                {new Date(contest.endTime).toLocaleString('vi-VN', { hour12: false })}
                              </span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <FiFileText className={`text-sm ${isPractice ? 'text-indigo-500' : 'text-orange-500'}`} />
                        <span className="text-xs text-gray-600">
                          <span className={`font-semibold ${isPractice ? 'text-indigo-600' : 'text-orange-600'}`}>
                            {contest.totalProblems}
                          </span> problems
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FiUsers className={`text-sm ${isPractice ? 'text-indigo-500' : 'text-orange-500'}`} />
                        <span className="text-xs text-gray-600">
                          <span className={`font-semibold ${isPractice ? 'text-indigo-600' : 'text-orange-600'}`}>
                            {contest.totalRegistrations}
                          </span> participants
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
          </div>
        </div>
        </div>
      </Container>
    </div>
  );
};

export default ContestPage;