import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Loading from '@/components/Loading';
import { problemApi, type TestCaseResponse } from '@/apis/problem.api';
import type { ProblemResponse } from '@/types/problem.types';
import { submissionApi, type RunCodeResponse, type CustomTestCase, type SubmissionResponse, type SubmissionDetailResponse, type ProblemSolutionResponse } from '@/apis/submission.api';
import { contestApi } from '@/apis/contest.api';
import { ROUTES } from '@/utils/constants';
import type { ProblemDetailResponse } from '@/types/problem.types';
import toast from 'react-hot-toast';
import AIChatPanel from '@/components/AIChatPanel/AIChatPanel';
import { aiApi } from '@/apis/ai.api';
import TopBar from './components/TopBar';
import ProblemListSidebar from './components/ProblemListSidebar';
import ProblemDescriptionPanel from './components/ProblemDescriptionPanel';
import CodeEditorPanel from './components/CodeEditorPanel';
import ResizeHandle from './components/ResizeHandle';
import { useAuth } from '@/hooks/useAuth';
import type { TabType, EditorTabType, ResizeSide } from './types';
import ContestHeader from '@/components/Contest/ContestHeader';
import type { ContestDetailResponse, ContestSubmissionResponse } from '@/types/contest.types';

const ProblemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const contestId = searchParams.get('contestId');
  const [problem, setProblem] = useState<ProblemDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contest, setContest] = useState<ContestDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTabType>('code');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sampleTestCases, setSampleTestCases] = useState<TestCaseResponse[]>([]);
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>([]);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);
  const [runResults, setRunResults] = useState<RunCodeResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [contestSubmissions, setContestSubmissions] = useState<ContestSubmissionResponse[]>([]);
  const [solutions, setSolutions] = useState<ProblemSolutionResponse[]>([]);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const [solutionsError, setSolutionsError] = useState<string | null>(null);
  const [solutionSearchInput, setSolutionSearchInput] = useState('');
  const [debouncedSolutionSearch, setDebouncedSolutionSearch] = useState('');
  const [solutionLanguageFilter, setSolutionLanguageFilter] = useState<string>('');
  const [solutionPage, setSolutionPage] = useState(0);
  const [solutionHasMore, setSolutionHasMore] = useState(true);
  const [isLoadingMoreSolutions, setIsLoadingMoreSolutions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetailResponse | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isProblemListOpen, setIsProblemListOpen] = useState(false);
  const [problemList, setProblemList] = useState<ProblemResponse[]>([]);
  const [isLoadingProblemList, setIsLoadingProblemList] = useState(false);
  const [problemListSearchQuery, setProblemListSearchQuery] = useState('');
  const [totalSolved, setTotalSolved] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>(() => {
    // Load theme from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editorTheme');
      return (saved as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [originalCode, setOriginalCode] = useState('');
  const [refactoredCode, setRefactoredCode] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(33.33);
  const [isResizing, setIsResizing] = useState<ResizeSide>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartLeftWidth = useRef<number>(33.33);
  const resizeStartMiddleWidth = useRef<number>(33.33);

  // Nếu đang trong contest và ở tab Review, chuyển về tab Code
  useEffect(() => {
    if (contestId && activeEditorTab === 'review') {
      setActiveEditorTab('code');
    }
  }, [contestId, activeEditorTab]);

  // Nếu đang trong contest và ở các tab bị ẩn, chuyển về tab Description
  useEffect(() => {
    if (contestId && (activeTab === 'editorial' || activeTab === 'solutions' || activeTab === 'comments' || activeTab === 'leaderboard')) {
      setActiveTab('description');
    }
  }, [contestId, activeTab]);

  // Fetch contest data if in contest mode
  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId) return;
      try {
        const contestData = await contestApi.getContestById(Number(contestId));
        setContest(contestData);
      } catch (error) {
        console.error('Error fetching contest:', error);
      }
    };
    fetchContest();
  }, [contestId]);

  // Fetch problem
  useEffect(() => {
    const fetchProblem = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await problemApi.getProblemDetail(Number(id));
        setProblem(data);
        
        if (data.languages && data.languages.length > 0) {
          setSelectedLanguage((prevLang: string) => {
            const isCurrentLangAvailable = data.languages.some(lang => lang.code === prevLang);
            if (!isCurrentLangAvailable) {
              return data.languages[0].code || 'cpp';
            }
            return prevLang;
          });
        }

        try {
          const sampleCases = await problemApi.getSampleTestCases(Number(id));
          setSampleTestCases(sampleCases);
          if (sampleCases.length > 0) {
            setSelectedTestCaseIndex(0);
          }
        } catch (error) {
          console.error('Error fetching sample testcases:', error);
        }

        try {
          const bookmarkStatus = await problemApi.checkBookmark(Number(id));
          setIsBookmarked(bookmarkStatus.isBookmarked);
        } catch (error) {
          // Ignore if not authenticated
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Không tìm thấy bài tập';
        toast.error(message);
        navigate(ROUTES.PROBLEMS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblem();
  }, [id, navigate]);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!id || activeTab !== 'submissions') return;
      
      try {
        setIsLoadingSubmissions(true);
        
        // Nếu đang trong contest context, fetch contest submissions
        if (contestId) {
          try {
            const contestSubs = await contestApi.getContestSubmissions(Number(contestId), Number(id));
            setContestSubmissions(contestSubs);
            // Map contest submissions to regular submissions format for display
            setSubmissions([]); // Clear regular submissions when in contest mode
          } catch (error: any) {
            console.error('Error fetching contest submissions:', error);
            // Fallback to regular submissions if contest submissions fail
            const response = await submissionApi.getMySubmissions({
              problemId: Number(id),
              page: 0,
              size: 50,
            });
            setSubmissions(response.content || []);
          }
        } else {
          // Regular problem submissions
          const response = await submissionApi.getMySubmissions({
            problemId: Number(id),
            page: 0,
            size: 50,
          });
          setSubmissions(response.content || []);
          setContestSubmissions([]);
        }
      } catch (error: any) {
        console.error('Error fetching submissions:', error);
        if (error.response?.status !== 401) {
          toast.error('Không thể tải lịch sử submissions');
        }
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [id, activeTab, contestId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSolutionSearch(solutionSearchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [solutionSearchInput]);

  // Reset pagination when filters change
  useEffect(() => {
    setSolutionPage(0);
    setSolutionHasMore(true);
  }, [debouncedSolutionSearch, solutionLanguageFilter]);

  // Fetch public solutions (only after user solved this problem)
  useEffect(() => {
    const fetchSolutions = async () => {
      if (!id || contestId || activeTab !== 'solutions') return;

      try {
        setIsLoadingSolutions(true);
        setSolutionsError(null);
        const response = await submissionApi.getProblemSolutions({
          problemId: Number(id),
          search: debouncedSolutionSearch || undefined,
          languageCode: solutionLanguageFilter || undefined,
          offset: solutionPage * 10,
          limit: 10,
        });
        
        if (solutionPage === 0) {
          setSolutions(response);
        } else {
          setSolutions((prev) => [...prev, ...response]);
        }
        
        setSolutionHasMore(response.length >= 10);
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Không thể tải Solutions';
        if (solutionPage === 0) {
          setSolutions([]);
        }
        setSolutionsError(message);
      } finally {
        setIsLoadingSolutions(false);
      }
    };

    fetchSolutions();
  }, [id, activeTab, contestId, debouncedSolutionSearch, solutionLanguageFilter, solutionPage]);

  // Fetch problem list
  useEffect(() => {
    const fetchProblemList = async () => {
      if (!isProblemListOpen) return;
      
      try {
        setIsLoadingProblemList(true);
        const response = await problemApi.getProblems({
          page: 0,
          size: 100,
          sortBy: 'id',
          sortDir: 'ASC',
        });
        setProblemList(response.content || []);
        const solved = (response.content || []).filter(p => p.status === 'COMPLETED').length;
        setTotalSolved(solved);
      } catch (error: any) {
        console.error('Error fetching problem list:', error);
        if (error.response?.status !== 401) {
          toast.error('Không thể tải danh sách problems');
        }
      } finally {
        setIsLoadingProblemList(false);
      }
    };

    fetchProblemList();
  }, [isProblemListOpen]);

  // Timer effects
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Panel resize effects
  useEffect(() => {
    // Nếu đang trong contest, không cho phép mở AI chat
    if (contestId) {
      setIsChatOpen(false);
      setLeftPanelWidth(50);
      setMiddlePanelWidth(50);
      return;
    }
    
    if (isChatOpen) {
      setLeftPanelWidth(33.33);
      setMiddlePanelWidth(33.33);
    } else {
      setLeftPanelWidth(50);
      setMiddlePanelWidth(50);
    }
  }, [isChatOpen, contestId]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const container = document.querySelector('.main-content-container') as HTMLElement;
      if (!container) return;
      const containerWidth = container.offsetWidth;
      const deltaX = ((e.clientX - resizeStartX.current) / containerWidth) * 100;

      // Nếu đang trong contest, không cho phép resize để mở AI chat
      if (contestId) {
        const newLeftWidth = Math.max(25, Math.min(75, resizeStartLeftWidth.current + deltaX));
        const newRightWidth = 100 - newLeftWidth;
        if (newRightWidth >= 25 && newLeftWidth >= 25) {
          setLeftPanelWidth(newLeftWidth);
          setMiddlePanelWidth(newRightWidth);
        }
        return;
      }

      if (isChatOpen) {
        // 3 panels mode: left, middle, right (AI chat)
        if (isResizing === 'left') {
          const newLeftWidth = Math.max(20, Math.min(60, resizeStartLeftWidth.current + deltaX));
          const newMiddleWidth = Math.max(20, Math.min(60, resizeStartMiddleWidth.current - deltaX));
          const rightWidth = 100 - newLeftWidth - newMiddleWidth;
          if (rightWidth >= 20 && newLeftWidth >= 20 && newMiddleWidth >= 20) {
            setLeftPanelWidth(newLeftWidth);
            setMiddlePanelWidth(newMiddleWidth);
          }
        } else if (isResizing === 'right') {
          const newMiddleWidth = Math.max(20, Math.min(60, resizeStartMiddleWidth.current + deltaX));
          const rightWidth = 100 - resizeStartLeftWidth.current - newMiddleWidth;
          if (rightWidth >= 20 && newMiddleWidth >= 20 && resizeStartLeftWidth.current >= 20) {
            setMiddlePanelWidth(newMiddleWidth);
          }
        }
      } else {
        // 2 panels mode: left (problem), right (code editor)
        // When resizing, adjust left panel width, right panel = 100 - left
        const newLeftWidth = Math.max(25, Math.min(75, resizeStartLeftWidth.current + deltaX));
        const newRightWidth = 100 - newLeftWidth;
        if (newRightWidth >= 25 && newLeftWidth >= 25) {
          setLeftPanelWidth(newLeftWidth);
          setMiddlePanelWidth(newRightWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isChatOpen, contestId]);

  // Handlers
  const handleToggleBookmark = async () => {
    if (!id) return;
    try {
      const response = await problemApi.toggleBookmark(Number(id));
      setIsBookmarked(response.isBookmarked);
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi đánh dấu sao');
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập code');
      return;
    }
    if (!problem) return;

    const selectedLang = problem.languages.find(l => l.code === selectedLanguage);
    if (!selectedLang) {
      toast.error('Ngôn ngữ không hợp lệ');
      return;
    }

    try {
      setIsSubmitting(true);
      setRunResults(null);
      
      const response = await submissionApi.submitCode({
        problemId: problem.id,
        languageId: selectedLang.id,
        codeContent: code,
      });

      toast.success('Đã submit thành công! Đang chờ kết quả...');
      
      const pollSubmission = async (submissionId: number) => {
        let attempts = 0;
        const maxAttempts = 120;
        
        const checkSubmission = async () => {
          attempts++;
          try {
            const submission = await submissionApi.getSubmissionById(submissionId);
            const isPending = submission.state === 'PENDING' || 
                             (submission.state === undefined && submission.statusCode === 0);
            
            if (!isPending) {
              setIsSubmitting(false);
              
              // Nếu đang trong contest context, tự động submit vào contest
              if (contestId && submission.id) {
                try {
                  await contestApi.submitToContest(Number(contestId), submission.id);
                  toast.success('Đã submit vào contest!');
                  // Refresh contest data để cập nhật điểm
                  try {
                    const contestData = await contestApi.getContestById(Number(contestId));
                    setContest(contestData);
                  } catch (e) {
                    console.error('Error refreshing contest:', e);
                  }
                } catch (e: any) {
                  // Không hiển thị lỗi nếu đã submit rồi hoặc contest đã kết thúc
                  if (!e?.response?.data?.message?.includes('đã được gửi')) {
                    console.error('Error submitting to contest:', e);
                  }
                }
              }
              
              const runResult: RunCodeResponse = {
                success: submission.isAccepted || false,
                message: submission.statusMsg || '',
                testResults: submission.testResults || [],
                totalPassed: submission.totalCorrect || 0,
                totalTests: submission.totalTestcases || 0,
                compileError: submission.compileError,
                fullCompileError: submission.fullCompileError,
              };
              setRunResults(runResult);
              setActiveEditorTab('result');
              if (submission.isAccepted) {
                toast.success(`✅ Accepted! ${submission.totalCorrect}/${submission.totalTestcases} test cases passed`);
              } else {
                toast.error(`❌ ${submission.statusMsg}`);
              }
              return true;
            } else if (attempts >= maxAttempts) {
              setIsSubmitting(false);
              toast.error('Timeout: Không nhận được kết quả sau 60 giây');
              return true;
            }
            return false;
          } catch (error) {
            console.error('Error polling submission:', error);
            return false;
          }
        };
        
        const firstCheck = await checkSubmission();
        if (firstCheck) return;
        
        const interval = setInterval(async () => {
          const hasResult = await checkSubmission();
          if (hasResult) {
            clearInterval(interval);
          }
        }, 500);
      };

      pollSubmission(response.id);
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || 'Lỗi khi submit code');
    }
  };

  const handleTest = async () => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập code');
      return;
    }
    if (!problem) return;

    const selectedLang = problem.languages.find(l => l.code === selectedLanguage);
    if (!selectedLang) {
      toast.error('Ngôn ngữ không hợp lệ');
      return;
    }

    try {
      setIsRunning(true);
      setRunResults(null);
      const customCases = customTestCases.filter(tc => tc.input.trim());
      const response = await submissionApi.runCode({
        problemId: problem.id,
        languageId: selectedLang.id,
        codeContent: code,
        customTestCases: customCases.length > 0 ? customCases : undefined,
      });

      setRunResults(response);
      setActiveEditorTab('result');
      
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi chạy code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartTimer = () => setIsTimerRunning(true);
  const handleStopTimer = () => setIsTimerRunning(false);
  const handleResetTimer = () => {
    setTimer(0);
    setIsTimerRunning(false);
  };

  const handleLoadMoreSolutions = async () => {
    setIsLoadingMoreSolutions(true);
    try {
      const response = await submissionApi.getProblemSolutions({
        problemId: Number(id),
        search: debouncedSolutionSearch || undefined,
        languageCode: solutionLanguageFilter || undefined,
        offset: (solutionPage + 1) * 10,
        limit: 10,
      });
      
      setSolutions((prev) => [...prev, ...response]);
      setSolutionPage((prev) => prev + 1);
      setSolutionHasMore(response.length >= 10);
    } catch (error) {
      console.error('Error loading more solutions:', error);
      toast.error('Không thể tải thêm Solutions');
    } finally {
      setIsLoadingMoreSolutions(false);
    }
  };

  const handleApplyToEditor = (codeContent: string) => {
    setCode(codeContent);
    setActiveTab('description'); // Keep on description tab or switch to code editor if needed
    toast.success('Code đã được áp dụng vào editor');
  };

  const handleToggleTheme = () => {
    const newTheme = editorTheme === 'light' ? 'dark' : 'light';
    setEditorTheme(newTheme);
    localStorage.setItem('editorTheme', newTheme);
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleResizeStart = (side: ResizeSide, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(side);
    resizeStartX.current = e.clientX;
    resizeStartLeftWidth.current = leftPanelWidth;
    resizeStartMiddleWidth.current = middlePanelWidth;
  };

  // Handle resize between 2 panels (when AI chat is closed)
  const handleTwoPanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('left'); // Use 'left' for 2-panel mode
    resizeStartX.current = e.clientX;
    resizeStartLeftWidth.current = leftPanelWidth;
    resizeStartMiddleWidth.current = middlePanelWidth;
  };

  const handleRefactor = async () => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập code trước khi refactor');
      return;
    }
    if (!problem) return;
    try {
      setIsRefactoring(true);
      setOriginalCode(code);
      const selectedLang = problem.languages.find(l => l.code === selectedLanguage);
      if (!selectedLang) {
        toast.error('Ngôn ngữ không hợp lệ');
        return;
      }
      const response = await aiApi.refactorCode({
        problemId: problem.id,
        code: code,
        language: selectedLanguage
      });
      setRefactoredCode(response.refactoredCode);
      setShowDiff(true);
      toast.success('Refactor thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi refactor code');
    } finally {
      setIsRefactoring(false);
    }
  };

  const handleRefactorSuggestions = async (suggestions: string[]) => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập code trước khi refactor');
      return;
    }
    if (!problem) return;
    if (suggestions.length === 0) {
      toast.error('Vui lòng chọn ít nhất một gợi ý để refactor');
      return;
    }
    try {
      setIsRefactoring(true);
      setOriginalCode(code);
      const selectedLang = problem.languages.find(l => l.code === selectedLanguage);
      if (!selectedLang) {
        toast.error('Ngôn ngữ không hợp lệ');
        return;
      }
      // Refactor với suggestions cụ thể - tối ưu token hơn
      const response = await aiApi.refactorCode({
        problemId: problem.id,
        code: code,
        language: selectedLanguage,
        suggestions: suggestions // Chỉ refactor theo suggestions đã chọn
      });
      setRefactoredCode(response.refactoredCode);
      setShowDiff(true);
      toast.success(`Refactor thành công theo ${suggestions.length} gợi ý đã chọn!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi refactor code');
    } finally {
      setIsRefactoring(false);
    }
  };

  const handleReview = async () => {
    if (!code.trim()) {
      toast.error('Please enter code before reviewing');
      return;
    }
    if (!problem) return;
    try {
      setIsReviewing(true);
      setReviewResult(null);
      const selectedLang = problem.languages.find(l => l.code === selectedLanguage);
      if (!selectedLang) {
        toast.error('Invalid language');
        return;
      }
      const response = await aiApi.reviewCode({
        problemId: problem.id,
        code: code,
        language: selectedLanguage
      });
      setReviewResult(response.review);
      setActiveEditorTab('review'); // Switch to Review tab instead of opening modal
      toast.success('Code review completed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error reviewing code');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleAcceptRefactor = () => {
    setCode(refactoredCode);
    setShowDiff(false);
    setRefactoredCode('');
    toast.success('Đã áp dụng code đã refactor');
  };

  const handleCancelRefactor = () => {
    setShowDiff(false);
    setRefactoredCode('');
    toast.success('Đã hủy refactor');
  };

  const handleSelectSubmission = async (submission: SubmissionDetailResponse | any) => {
    try {
      // Check if this is a contest submission (has codeContent directly)
      if (submission.codeContent && contestId) {
        // Contest submission: use codeContent directly
        setSelectedSubmission(submission as SubmissionDetailResponse);
        setCode(submission.codeContent || '');
        if (submission.language && problem?.languages) {
          const lang = problem.languages.find(l => 
            l.name === submission.language || l.code === submission.language?.toLowerCase()
          );
          if (lang && lang.code) {
            setSelectedLanguage(lang.code);
          }
        }
        const runResult: RunCodeResponse = {
          success: submission.isAccepted || false,
          message: submission.statusMsg || '',
          testResults: [],
          totalPassed: 0,
          totalTests: 0,
          compileError: null,
          fullCompileError: null,
        };
        setRunResults(runResult);
        setActiveEditorTab('result');
      } else {
        // Regular submission: fetch detail from API
        const detail = await submissionApi.getSubmissionById(submission.id);
        setSelectedSubmission(detail);
        setCode(detail.codeContent || '');
        if (detail.languageName && problem?.languages) {
          const lang = problem.languages.find(l => 
            l.name === detail.languageName || l.code === detail.languageName?.toLowerCase()
          );
          if (lang && lang.code) {
            setSelectedLanguage(lang.code);
          }
        }
        const runResult: RunCodeResponse = {
          success: detail.isAccepted || false,
          message: detail.statusMsg || '',
          testResults: detail.testResults || [],
          totalPassed: detail.totalCorrect || 0,
          totalTests: detail.totalTestcases || 0,
          compileError: detail.compileError,
          fullCompileError: detail.fullCompileError,
        };
        setRunResults(runResult);
        setActiveEditorTab('result');
      }
    } catch (error: any) {
      toast.error('Không thể tải chi tiết submission');
    }
  };

  const handleAddCustomTestCase = () => {
    const newCase: CustomTestCase = { input: '', expectedOutput: '' };
    setCustomTestCases([...customTestCases, newCase]);
    setSelectedTestCaseIndex(sampleTestCases.length + customTestCases.length);
  };

  const handleDeleteCustomTestCase = (index: number) => {
    const newCases = customTestCases.filter((_, i) => i !== index);
    setCustomTestCases(newCases);
    if (newCases.length === 0) {
      setSelectedTestCaseIndex(0);
    } else if (selectedTestCaseIndex >= sampleTestCases.length + newCases.length) {
      setSelectedTestCaseIndex(sampleTestCases.length + newCases.length - 1);
    }
  };

  const handleUpdateCustomTestCase = (index: number, testCase: CustomTestCase) => {
    const newCases = [...customTestCases];
    newCases[index] = testCase;
    setCustomTestCases(newCases);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!problem) {
    return null;
  }

  // Kiểm tra nếu contest đã kết thúc thì không cho xem bài
  const isContestEnded = () => {
    if (!contestId || !contest) return false;
    const now = new Date();
    const end = new Date(contest.endTime);
    return now >= end;
  };

  if (isContestEnded()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">Contest đã kết thúc</div>
          <div className="text-gray-600 mb-4">Bạn không thể xem hoặc làm bài nữa</div>
          <button
            onClick={() => navigate(`/contest/${contestId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại Contest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <TopBar
        onToggleProblemList={() => setIsProblemListOpen(!isProblemListOpen)}
        onRun={handleTest}
        onSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        timer={timer}
        isTimerRunning={isTimerRunning}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
        onResetTimer={handleResetTimer}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleToggleBookmark}
        contest={contestId && contest ? contest : null}
        currentProblemId={Number(id)}
      />

      <ProblemListSidebar
        isOpen={isProblemListOpen}
        onClose={() => setIsProblemListOpen(false)}
        problemList={problemList}
        isLoading={isLoadingProblemList}
        searchQuery={problemListSearchQuery}
        onSearchChange={setProblemListSearchQuery}
        totalSolved={totalSolved}
        currentProblemId={id}
      />

      <div className={`flex flex-1 overflow-hidden main-content-container ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
        <div 
          className="border-r border-gray-200 bg-white overflow-y-auto"
          style={{ width: isChatOpen ? `${leftPanelWidth}%` : '50%' }}
        >
          <ProblemDescriptionPanel
            problem={problem}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            submissions={submissions}
            contestSubmissions={contestSubmissions}
            solutions={solutions}
            isLoadingSolutions={isLoadingSolutions}
            solutionsError={solutionsError}
            solutionSearchInput={solutionSearchInput}
            onSolutionSearchInputChange={setSolutionSearchInput}
            solutionLanguageFilter={solutionLanguageFilter}
            onSolutionLanguageFilterChange={setSolutionLanguageFilter}
            solutionHasMore={solutionHasMore}
            isLoadingMoreSolutions={isLoadingMoreSolutions}
            onLoadMoreSolutions={handleLoadMoreSolutions}
            onApplyToEditor={handleApplyToEditor}
            isLoadingSubmissions={isLoadingSubmissions}
            selectedSubmission={selectedSubmission}
            onSelectSubmission={handleSelectSubmission}
            runResults={runResults}
            currentUserId={user?.id}
            contestId={contestId}
          />
        </div>

        {/* Resize Handle - Always show between left and middle panels */}
        <div
          className={`w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
            isResizing === 'left' ? 'bg-blue-500' : ''
          }`}
          onMouseDown={(e) => {
            if (isChatOpen) {
              handleResizeStart('left', e);
            } else {
              handleTwoPanelResizeStart(e);
            }
          }}
        >
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-transparent group-hover:bg-blue-500" />
        </div>

        <div 
          className="flex flex-col bg-white border-l border-gray-200"
          style={{ width: isChatOpen ? `${middlePanelWidth}%` : `${middlePanelWidth}%` }}
        >
          <CodeEditorPanel
            problem={problem}
            code={code}
            onCodeChange={setCode}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            activeEditorTab={activeEditorTab}
            onEditorTabChange={setActiveEditorTab}
            isChatOpen={isChatOpen}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            editorTheme={editorTheme}
            onToggleTheme={handleToggleTheme}
            runResults={runResults}
            showDiff={showDiff}
            originalCode={originalCode}
            refactoredCode={refactoredCode}
            isRefactoring={isRefactoring}
            onRefactor={handleRefactor}
            onAcceptRefactor={handleAcceptRefactor}
            onCancelRefactor={handleCancelRefactor}
            isReviewing={isReviewing}
            onReview={handleReview}
            reviewResult={reviewResult}
            onRefactorSuggestions={handleRefactorSuggestions}
            sampleTestCases={sampleTestCases}
            customTestCases={customTestCases}
            selectedTestCaseIndex={selectedTestCaseIndex}
            onSelectTestCase={setSelectedTestCaseIndex}
            onAddCustomTestCase={handleAddCustomTestCase}
            onDeleteCustomTestCase={handleDeleteCustomTestCase}
            onUpdateCustomTestCase={handleUpdateCustomTestCase}
            contestId={contestId}
          />
        </div>

        {isChatOpen && !contestId && (
          <ResizeHandle
            side="right"
            isResizing={isResizing}
            onResizeStart={handleResizeStart}
          />
        )}

        {isChatOpen && problem && !contestId && (
          <div 
            className="flex flex-col bg-white border-l border-gray-200 overflow-hidden"
            style={{ width: `${100 - leftPanelWidth - middlePanelWidth}%` }}
          >
            <AIChatPanel
              problemId={problem.id}
              problemTitle={problem.title}
              problemDescription={problem.content}
              currentCode={code}
              language={selectedLanguage}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Review code now shows in Review tab instead of modal */}
    </div>
  );
};

export default ProblemDetailPage;

