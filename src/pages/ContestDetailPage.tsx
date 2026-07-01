import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Loading from '@/components/Loading';
import { contestApi } from '@/apis/contest.api';
import toast from 'react-hot-toast';
import type { ContestDetailResponse, ContestLeaderboardResponse, ContestRegistrationResponse } from '@/types/contest.types';
import { FiClock, FiUsers, FiUserPlus, FiArrowLeft, FiAward, FiTarget } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import ContestCountdown from '@/components/Contest/ContestCountdown';
import ContestRegistrationModal from '@/components/Contest/ContestRegistrationModal';
import ContestLeaderboard from '@/components/Contest/ContestLeaderboard';
import StartContestConfirmModal from '@/components/Contest/StartContestConfirmModal';
import ConfirmModal from '@/components/Modal/ConfirmModal';
import { formatDateTime24h } from '@/utils/dateFormat';

const ContestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState<ContestDetailResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<ContestLeaderboardResponse[]>([]);
  const [registrations, setRegistrations] = useState<ContestRegistrationResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'total' | number>('total');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showStartConfirmModal, setShowStartConfirmModal] = useState(false);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const [startingContest, setStartingContest] = useState(false);
  const [finishingContest, setFinishingContest] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [showReadMore, setShowReadMore] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchContest = async (showLoading = false) => {
    if (!id) return;
    if (showLoading) {
      setLoading(true);
    }
    try {
      const data = await contestApi.getContestById(Number(id));
      setContest(data);
      
      // Fetch leaderboard
      try {
        const lb = await contestApi.getContestLeaderboard(Number(id));
        setLeaderboard(lb);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      }

      // Fetch registrations
      try {
        const regs = await contestApi.getContestRegistrations(Number(id));
        setRegistrations(regs);
      } catch (e) {
        console.error('Error fetching registrations:', e);
      }
    } catch (e: any) {
      console.error(e);
      if (showLoading) {
        toast.error('Failed to fetch contest information');
        navigate('/contest');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Check if description is long enough to need "Read more"
  useEffect(() => {
    if (descriptionRef.current && contest?.description) {
      // Use a timeout to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        if (descriptionRef.current) {
          // Temporarily remove line-clamp to measure full height
          const element = descriptionRef.current;
          const hasLineClamp = element.classList.contains('line-clamp-4');
          if (hasLineClamp) {
            element.classList.remove('line-clamp-4');
          }
          
          const fullHeight = element.scrollHeight;
          const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight) || 24;
          const maxHeight = lineHeight * 4; // Show max 4 lines
          
          // Restore line-clamp if it was there
          if (hasLineClamp && !isDescriptionExpanded) {
            element.classList.add('line-clamp-4');
          }
          
          if (fullHeight > maxHeight) {
            setShowReadMore(true);
          } else {
            setShowReadMore(false);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [contest?.description, isDescriptionExpanded]);

  useEffect(() => {
    if (!id) {
      navigate('/contest');
      return;
    }

    // Initial load with loading indicator
    fetchContest(true);

    // Auto refresh every 5 seconds when contest is PRACTICE and user has started
    // Không set loading để tránh nháy trang
    const interval = setInterval(() => {
      if (contest?.contestType === 'PRACTICE' && contest.startedAt && contest.endedAt) {
        const now = new Date();
        const startedAt = new Date(contest.startedAt);
        const endedAt = new Date(contest.endedAt);
        if (now >= startedAt && now < endedAt) {
          fetchContest(false); // Không hiển thị loading
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, navigate, contest?.contestType, contest?.startedAt, contest?.endedAt]);

  // Refresh when window gains focus (user comes back from another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (id && contest?.contestType === 'PRACTICE' && contest.startedAt && contest.endedAt) {
        const now = new Date();
        const startedAt = new Date(contest.startedAt);
        const endedAt = new Date(contest.endedAt);
        if (now >= startedAt && now < endedAt) {
          fetchContest(false); // Không hiển thị loading
        }
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, contest?.contestType, contest?.startedAt, contest?.endedAt]);

  // Tự động refresh khi OFFICIAL contest chuyển từ UPCOMING sang ONGOING (chỉ check khi chưa bắt đầu)
  useEffect(() => {
    if (!id || !contest || contest.contestType !== 'OFFICIAL' || !contest.startTime) return;
    
    const now = new Date();
    const start = new Date(contest.startTime);
    
    // Chỉ check nếu contest chưa bắt đầu
    if (now < start) {
      // Check mỗi giây để phát hiện khi contest bắt đầu
      const interval = setInterval(() => {
        const currentTime = new Date();
        const startTime = new Date(contest.startTime!);
        if (currentTime >= startTime) {
          // Contest đã bắt đầu → refresh data một lần (không hiển thị loading)
          fetchContest(false);
          clearInterval(interval);
        }
      }, 1000); // Check mỗi giây
      
      return () => clearInterval(interval);
    }
  }, [id, contest, contest?.startTime]);

  const handleRegister = async (accessCode?: string) => {
    if (!id) return;
    try {
      await contestApi.registerContest(Number(id), accessCode ? { accessCode } : undefined);
      toast.success('Successfully registered for contest!');
      // Refresh contest data
      const data = await contestApi.getContestById(Number(id));
      setContest(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to register for contest');
      throw e;
    }
  };

  const handleStartContest = async () => {
    if (!id) return;
    setStartingContest(true);
    try {
      await contestApi.startContest(Number(id));
      toast.success('Successfully started contest!');
      // Refresh contest data
      const data = await contestApi.getContestById(Number(id));
      setContest(data);
      // Refresh leaderboard
      try {
        const lb = await contestApi.getContestLeaderboard(Number(id));
        setLeaderboard(lb);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to start contest');
    } finally {
      setStartingContest(false);
    }
  };

  const handleFinishContestClick = () => {
    setShowFinishConfirmModal(true);
  };

  const handleFinishContest = async () => {
    if (!id) return;
    setFinishingContest(true);
    try {
      await contestApi.finishContest(Number(id));
      toast.success('Successfully finished contest!');
      // Refresh contest data
      const data = await contestApi.getContestById(Number(id));
      setContest(data);
      // Refresh leaderboard
      try {
        const lb = await contestApi.getContestLeaderboard(Number(id));
        setLeaderboard(lb);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to finish contest');
    } finally {
      setFinishingContest(false);
      setShowFinishConfirmModal(false);
    }
  };

  const getStatusInfo = () => {
    if (!contest) return null;
    
    // PRACTICE contest không có startTime/endTime
    if (contest.contestType === 'PRACTICE') {
      return { status: 'AVAILABLE', targetTime: null, message: 'Available - You can start anytime' };
    }
    
    // OFFICIAL contest
    const now = new Date();
    if (!contest.startTime || !contest.endTime) {
      return { status: 'AVAILABLE', targetTime: null, message: 'Available' };
    }
    
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) {
      return { status: 'UPCOMING', targetTime: contest.startTime, message: 'Countdown to contest start' };
    } else if (now >= start && now < end) {
      return { status: 'ONGOING', targetTime: contest.endTime, message: 'Contest ends in' };
    } else {
      return { status: 'ENDED', targetTime: contest.endTime, message: 'Ended' };
    }
  };

  const canRegister = () => {
    if (!contest || !user) return false;
    // PRACTICE contest không cần đăng ký
    if (contest.contestType === 'PRACTICE') return false;
    // OFFICIAL contest
    if (contest.isRegistered) return false;
    if (!contest.startTime) return false;
    const now = new Date();
    const start = new Date(contest.startTime);
    // Có thể đăng ký trước khi contest bắt đầu
    return now < start;
  };

  const isPracticeTimeExpired = () => {
    if (!contest || contest.contestType !== 'PRACTICE' || !contest.endedAt) return false;
    const now = new Date();
    const endedAt = new Date(contest.endedAt);
    return now >= endedAt;
  };

  const canViewProblems = () => {
    if (!contest) return false;
    
    if (contest.contestType === 'PRACTICE') {
      // PRACTICE: user phải đã bắt đầu và chưa hết thời gian
      if (!contest.isRegistered || !contest.startedAt || !contest.endedAt) return false;
      const now = new Date();
      const startedAt = new Date(contest.startedAt);
      const endedAt = new Date(contest.endedAt);
      return now >= startedAt && now < endedAt;
    } else {
      // OFFICIAL: contest phải đã bắt đầu (bao gồm cả khi đã kết thúc để hiển thị điểm)
      if (!contest.startTime || !contest.endTime) return false;
      const now = new Date();
      const start = new Date(contest.startTime);
      // Cho phép xem problems nếu đã bắt đầu (bao gồm cả khi đã kết thúc) và đã đăng ký
      // Không cần kiểm tra user vì isRegistered đã đủ
      return now >= start && contest.isRegistered;
    }
  };

  const isContestStarted = () => {
    if (!contest) return false;
    if (contest.contestType === 'PRACTICE') {
      // PRACTICE: luôn có sẵn
      return true;
    }
    if (!contest.startTime) return false;
    const now = new Date();
    const start = new Date(contest.startTime);
    return now >= start;
  };

  const canStartContest = () => {
    if (!contest || !user) return false;
    if (contest.contestType !== 'PRACTICE') return false;
    // Có thể bắt đầu bất cứ lúc nào (hoặc làm lại nếu đã hết thời gian)
    return true;
  };

  if (loading || !contest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-12 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const problemOrders = contest?.problems.map((p) => p.order) || [];

  // Tính tổng điểm của user (lấy từ bestScore)
  const calculateTotalScore = () => {
    if (!contest || !contest.problems) return 0;
    return contest.problems.reduce((total, problem) => {
      // Lấy điểm cao nhất cho mỗi problem
      return total + (problem.bestScore || 0);
    }, 0);
  };

  const totalScore = calculateTotalScore();

  // Kiểm tra điều kiện hiển thị problems
  const shouldShowProblems = () => {
    if (!contest) return false;
    if (!contest.problems || contest.problems.length === 0) return false;
    if (!contest.isRegistered) return false;
    if (contest.contestType === 'OFFICIAL') {
      // OFFICIAL: dùng canViewProblems() vì nó đã xử lý logic đúng (bao gồm cả khi đã kết thúc)
      return canViewProblems();
    } else {
      // PRACTICE: phải đã bắt đầu và (đang làm hoặc đã hết thời gian)
      return contest.startedAt && (canViewProblems() || isPracticeTimeExpired());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/contest"
                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors hover:bg-gray-50 px-3 py-1.5 rounded-lg"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                <div className="relative w-9 h-9">
                  {/* Logo với gradient đẹp - Modern Code Sphere icon */}
                  <svg
                    className="w-9 h-9 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                    viewBox="0 0 44 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="contestLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <linearGradient id="contestLogoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    {/* Background circle with gradient */}
                    <circle cx="22" cy="22" r="20" fill="url(#contestLogoGradient)" opacity="0.15" />
                    <circle cx="22" cy="22" r="18" fill="url(#contestLogoGradient)" opacity="0.08" />
                    
                    {/* Code brackets - styled */}
                    <path
                      d="M13 15L9 19L13 23M31 15L35 19L31 23"
                      stroke="url(#contestLogoGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Inner bracket accent */}
                    <path
                      d="M14 15L10 19L14 23M30 15L34 19L30 23"
                      stroke="url(#contestLogoGradient2)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                    />
                    {/* Center elements */}
                    <circle cx="22" cy="19" r="2.5" fill="url(#contestLogoGradient)" />
                    <circle cx="18" cy="25" r="1" fill="url(#contestLogoGradient2)" opacity="0.8" />
                    <circle cx="26" cy="25" r="1" fill="url(#contestLogoGradient2)" opacity="0.8" />
                    {/* Decorative lines */}
                    <path
                      d="M19 19L22 22L25 19"
                      stroke="url(#contestLogoGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                  </svg>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-500/30 rounded-full blur-lg -z-10 group-hover:blur-xl group-hover:opacity-70 transition-all duration-300" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-cyan-500 group-hover:to-purple-500 transition-all duration-300">
                  CodeSphere
                </span>
              </Link>
            </div>
            {user && (
              <div className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors border border-indigo-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{user.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div 
          className="flex gap-6 items-start"
          style={{ 
            flexDirection: isDesktop ? 'row' : 'column'
          }}
        >
          {/* Left Content - Countdown + Total Score + Problems */}
          <div 
            className="space-y-6"
            style={{ 
              flex: isDesktop ? '1' : 'none',
              minWidth: isDesktop ? 0 : '100%',
              width: isDesktop ? 'auto' : '100%'
            }}
          >
            {/* Contest Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {contest.contestType === 'PRACTICE' ? (
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
                        <FiAward className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-sm">
                        <FiTarget className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900">
                      {contest.title}
                    </h1>
                  </div>
                  {contest.description && (
                    <div className="mb-3 ml-12">
                      <div
                        ref={descriptionRef}
                        className={`text-gray-600 whitespace-pre-wrap ${
                          showReadMore && !isDescriptionExpanded
                            ? 'line-clamp-4'
                            : ''
                        }`}
                      >
                        {contest.description}
                      </div>
                      {showReadMore && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors flex items-center gap-1"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              <span>Show less</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>Read more</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {/* Hiển thị thời gian bắt đầu và kết thúc cho OFFICIAL contest */}
                  {contest.contestType === 'OFFICIAL' && contest.startTime && contest.endTime && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        <span className="font-medium">Start:</span>
                        <span>{formatDateTime24h(contest.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        <span className="font-medium">End:</span>
                        <span>{formatDateTime24h(contest.endTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {/* PRACTICE Contest: Nút Bắt đầu / Làm lại / Hoàn thành */}
                  {user && contest.contestType === 'PRACTICE' && (
                    <>
                      {canViewProblems() && !isPracticeTimeExpired() ? (
                        // Đang làm bài → hiển thị nút "Hoàn thành"
                        <button
                          onClick={handleFinishContestClick}
                          disabled={finishingContest}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {finishingContest ? 'Finishing...' : 'Complete'}
                        </button>
                      ) : (
                        // Chưa bắt đầu hoặc đã hết thời gian → hiển thị nút "Bắt đầu" hoặc "Làm lại"
                        <button
                          onClick={() => setShowStartConfirmModal(true)}
                          disabled={startingContest}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {startingContest ? 'Starting...' : (contest.isRegistered && isPracticeTimeExpired()) ? 'Retake' : 'Start'}
                        </button>
                      )}
                    </>
                  )}
                  {/* OFFICIAL Contest: Nút Đăng ký hoặc Hoàn thành */}
                  {user && contest.contestType === 'OFFICIAL' && (
                    <>
                      {canRegister() && (
                        <button
                          onClick={() => setShowRegistrationModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiUserPlus /> Register
                        </button>
                      )}
                      {canViewProblems() && statusInfo?.status === 'ONGOING' && (
                        <button
                          onClick={handleFinishContestClick}
                          disabled={finishingContest}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {finishingContest ? 'Finishing...' : 'Complete'}
                        </button>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiUsers className="w-5 h-5" />
                    <span>{contest.totalRegistrations || 0} people</span>
                  </div>
                </div>
              </div>

              {/* PRACTICE Contest: Hiển thị thông tin hoặc countdown */}
              {contest.contestType === 'PRACTICE' && (
                <>
                  {!contest.isRegistered || !contest.endedAt || isPracticeTimeExpired() ? (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-indigo-600 mb-2">Practice Contest</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Duration: {contest.durationMinutes} minutes
                        </div>
                        <div className="text-sm text-gray-500">
                          {isPracticeTimeExpired() 
                            ? 'Time is up. You can retake to try again.'
                            : 'You can start anytime and retake multiple times'}
                        </div>
                      </div>
                    </div>
                  ) : contest.endedAt && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Time remaining:</div>
                        <ContestCountdown 
                          targetTime={contest.endedAt} 
                          showDays={false} // PRACTICE contest không hiển thị ngày
                          onComplete={() => {
                            // Refresh contest data khi hết thời gian (không hiển thị loading)
                            if (id) {
                              fetchContest(false);
                            }
                          }}
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          After time expires, you will not be able to submit anymore
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {statusInfo && statusInfo.status !== 'ENDED' && statusInfo.status !== 'AVAILABLE' && statusInfo.targetTime && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mt-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">{statusInfo.message}</div>
                    <ContestCountdown 
                      targetTime={statusInfo.targetTime} 
                      showDays={statusInfo.status === 'UPCOMING'} // Chỉ hiển thị ngày khi chờ bắt đầu
                      onComplete={() => {
                        // Tự động refresh khi countdown kết thúc (contest bắt đầu hoặc kết thúc)
                        // Không hiển thị loading để tránh nháy trang
                        if (id) {
                          fetchContest(false);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              {statusInfo && statusInfo.status === 'ENDED' && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mt-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600 mb-2">Contest has ended</div>
                    <div className="text-sm text-gray-600">The system has automatically calculated scores. You can view the results below</div>
                  </div>
                </div>
              )}
            </div>

            {/* Problems List - hiện khi contest đã bắt đầu hoặc đã kết thúc */}
            {shouldShowProblems() && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your total score</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-blue-600">{totalScore}</div>
                    <div className="text-gray-500">points</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Score details per problem:</h3>
                  {contest.problems.map((problem) => (
                    <div
                      key={problem.problemId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-indigo-600">{problem.order}</span>
                        <div>
                          <div className="font-medium text-gray-900">{problem.problem?.title || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{problem.points} max points</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {problem.isSolved ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg font-medium flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                            {problem.bestScore || problem.points} / {problem.points} points
                          </span>
                        ) : problem.bestScore > 0 ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                            {problem.bestScore} / {problem.points} điểm
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">
                            0 / {problem.points} points
                          </span>
                        )}
                        {(statusInfo?.status !== 'ENDED' && !(contest.contestType === 'PRACTICE' && isPracticeTimeExpired())) ? (
                          <button
                            onClick={() => navigate(`/problems/${problem.problemId}?contestId=${id}`)}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Solve
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/problems/${problem.problemId}`)}
                            className="px-4 py-2 text-sm bg-gray-400 text-white rounded-lg cursor-not-allowed"
                            disabled
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nếu không thể xem problems, hiển thị thông báo */}
            {!shouldShowProblems() && !(statusInfo?.status === 'ENDED') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                  <FiClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {contest.contestType === 'PRACTICE' 
                      ? 'You have not started this contest yet' 
                      : 'Contest has not started'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {contest.contestType === 'PRACTICE'
                      ? 'Please click the "Start" button to begin'
                      : 'Problems will be displayed when the contest starts'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Leaderboard */}
          <div 
            className="bg-white rounded-lg shadow-sm border border-gray-200"
            style={{ 
              width: isDesktop ? '450px' : '100%',
              flexShrink: isDesktop ? 0 : 1,
              position: isDesktop ? 'sticky' : 'relative',
              top: isDesktop ? '5rem' : 'auto',
              alignSelf: isDesktop ? 'flex-start' : 'stretch'
            }}
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
            </div>
            <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <ContestLeaderboard leaderboard={leaderboard} problemOrders={problemOrders} />
            </div>
          </div>
        </div>
      </div>

      <ContestRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onRegister={handleRegister}
        isPublic={contest.isPublic}
        hasAccessCode={contest.hasAccessCode}
      />

      {contest.contestType === 'PRACTICE' && contest.durationMinutes && (
        <StartContestConfirmModal
          isOpen={showStartConfirmModal}
          onClose={() => setShowStartConfirmModal(false)}
          onConfirm={handleStartContest}
          durationMinutes={contest.durationMinutes}
          isRetake={contest.isRegistered && isPracticeTimeExpired()}
        />
      )}

      <ConfirmModal
        isOpen={showFinishConfirmModal}
        onClose={() => setShowFinishConfirmModal(false)}
        onConfirm={handleFinishContest}
        title="Finish Contest"
        message="Are you sure you want to finish this contest? After finishing, you will not be able to submit anymore."
        confirmText="Finish"
        cancelText="Cancel"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default ContestDetailPage;

