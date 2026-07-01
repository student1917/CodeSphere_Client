import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiAlertCircle, FiCode, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { submissionApi, type SubmissionDetailResponse, type SubmissionResponse } from '@/apis/submission.api';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';

const STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'WRONG_ANSWER', label: 'Wrong Answer' },
  { value: 'COMPILE_ERROR', label: 'Compile Error' },
  { value: 'RUNTIME_ERROR', label: 'Runtime Error' },
  { value: 'TIME_LIMIT_EXCEEDED', label: 'Time Limit Exceeded' },
  { value: 'MEMORY_LIMIT_EXCEEDED', label: 'Memory Limit Exceeded' },
  { value: 'ERROR', label: 'Error' },
];

const stateLabel = (submission: SubmissionResponse | SubmissionDetailResponse) => {
  return submission.state || submission.status || 'UNKNOWN';
};

const displayState = (state: string) => state.replaceAll('_', ' ');

const isFailureState = (state: string) => {
  return [
    'WRONG_ANSWER',
    'COMPILE_ERROR',
    'RUNTIME_ERROR',
    'TIME_LIMIT_EXCEEDED',
    'MEMORY_LIMIT_EXCEEDED',
    'ERROR',
  ].includes(state);
};

const statusStyle = (state: string) => {
  if (state === 'ACCEPTED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (state === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (state === 'COMPILE_ERROR') return 'bg-orange-50 text-orange-700 border-orange-100';
  if (state === 'RUNTIME_ERROR' || state === 'ERROR') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (state === 'WRONG_ANSWER') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (state === 'TIME_LIMIT_EXCEEDED' || state === 'MEMORY_LIMIT_EXCEEDED') return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
  return 'bg-slate-50 text-slate-700 border-slate-100';
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return value;
  }
};

const MySubmissionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [problemKeywordInput, setProblemKeywordInput] = useState('');
  const [debouncedProblemKeyword, setDebouncedProblemKeyword] = useState('');
  const [status, setStatus] = useState('');

  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await submissionApi.getMySubmissions({
        page,
        size,
        status: status || undefined,
        search: debouncedProblemKeyword || undefined,
      });

      setSubmissions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch submissions');
      setSubmissions([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedProblemKeyword(problemKeywordInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [problemKeywordInput]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, debouncedProblemKeyword]);

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

  const openSubmissionDetail = async (submissionId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await submissionApi.getSubmissionById(submissionId);
      setSelectedSubmission(detail);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch submission detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <MainSection
      loading={loading}
      submissions={submissions}
      totalElements={totalElements}
      page={page}
      pageNumbers={pageNumbers}
      totalPages={totalPages}
      status={status}
      setStatus={setStatus}
      problemKeywordInput={problemKeywordInput}
      setProblemKeywordInput={setProblemKeywordInput}
      setPage={setPage}
      openSubmissionDetail={openSubmissionDetail}
      selectedSubmission={selectedSubmission}
      setSelectedSubmission={setSelectedSubmission}
      loadingDetail={loadingDetail}
    />
  );
};

type MainSectionProps = {
  loading: boolean;
  submissions: SubmissionResponse[];
  totalElements: number;
  page: number;
  pageNumbers: number[];
  totalPages: number;
  status: string;
  setStatus: (value: string) => void;
  problemKeywordInput: string;
  setProblemKeywordInput: (value: string) => void;
  setPage: (value: number | ((current: number) => number)) => void;
  openSubmissionDetail: (id: number) => Promise<void>;
  selectedSubmission: SubmissionDetailResponse | null;
  setSelectedSubmission: (value: SubmissionDetailResponse | null) => void;
  loadingDetail: boolean;
};

const MainSection = ({
  loading,
  submissions,
  totalElements,
  page,
  pageNumbers,
  totalPages,
  status,
  setStatus,
  problemKeywordInput,
  setProblemKeywordInput,
  setPage,
  openSubmissionDetail,
  selectedSubmission,
  setSelectedSubmission,
  loadingDetail,
}: MainSectionProps) => {
  const acceptedCount = submissions.filter((item) => stateLabel(item) === 'ACCEPTED').length;
  const pendingCount = submissions.filter((item) => stateLabel(item) === 'PENDING').length;
  const failedCount = submissions.filter((item) => isFailureState(stateLabel(item))).length;
  const acceptedRate = submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 100) : 0;

  if (loading && submissions.length === 0) {
    return (
      <div className="py-16 flex justify-center">
        <Loading text="Loading your submissions..." />
      </div>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-slate-900">My Submissions</h1>
          <p className="text-sm text-slate-500 mt-1">Track all your code submissions, status, runtime and detailed results.</p>

          <div className="mt-5 grid grid-cols-2 tablet:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Current Page</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{submissions.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Accepted</div>
              <div className="text-xl font-extrabold text-emerald-800 mt-1 tabular-nums">{acceptedCount}</div>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-rose-700">Failed</div>
              <div className="text-xl font-extrabold text-rose-800 mt-1 tabular-nums">{failedCount}</div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-blue-700">Accepted Rate</div>
              <div className="text-xl font-extrabold text-blue-800 mt-1 tabular-nums">{acceptedRate}%</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 desktop:grid-cols-12 gap-3 items-center">
            <div className="relative desktop:col-span-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by problem title..."
                value={problemKeywordInput}
                onChange={(e) => {
                  setProblemKeywordInput(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full desktop:col-span-3 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>

            <div className="flex gap-2 desktop:col-span-5 justify-end">
              <button
                onClick={() => {
                  setProblemKeywordInput('');
                  setStatus('');
                  setPage(0);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold text-right">ID</th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold">Problem</th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold">Language</th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold">Status</th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold text-right">Runtime/Memory</th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold">Submitted At</th>
                  <th className="p-4 text-[11px] uppercase tracking-wider text-slate-500 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">No submissions found.</td>
                  </tr>
                ) : (
                  submissions.map((submission) => {
                    const currentState = stateLabel(submission);
                    const hasFailure = isFailureState(currentState);
                    return (
                      <tr key={submission.id} className={`hover:bg-slate-50/60 transition-colors ${hasFailure ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-4 text-sm font-semibold text-slate-800 text-right tabular-nums">#{submission.id}</td>
                        <td className="p-4 text-sm">
                          <div className="font-semibold text-slate-900">{submission.problemTitle}</div>
                          <div className="text-xs text-slate-500">Problem #{submission.problemId}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-700">{submission.languageName}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle(currentState)}`}>
                            {displayState(currentState)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 text-right tabular-nums">
                          <div>{submission.statusRuntime || '-'}</div>
                          <div>{submission.statusMemory || '-'}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(submission.createdAt)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openSubmissionDetail(submission.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              hasFailure
                                ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <FiCode size={14} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
            <div className="text-xs text-slate-600">Showing {submissions.length} of {totalElements} submissions • Pending: {pendingCount}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50"
              >
                <FiChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold ${page === pageNumber ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50"
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {(selectedSubmission || loadingDetail) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={() => !loadingDetail && setSelectedSubmission(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900">Submission Detail</div>
                {selectedSubmission && <div className="text-xs text-slate-500">#{selectedSubmission.id} • {selectedSubmission.problemTitle}</div>}
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                disabled={loadingDetail}
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {loadingDetail || !selectedSubmission ? (
              <div className="p-10 flex justify-center">
                <Loading text="Loading submission detail..." />
              </div>
            ) : (
              <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
                <div className="grid grid-cols-1 tablet:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-[11px] uppercase font-bold text-slate-500">Status</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {stateLabel(selectedSubmission) === 'ACCEPTED' ? <FiCheckCircle className="text-emerald-600" /> : <FiXCircle className="text-rose-600" />}
                      {stateLabel(selectedSubmission)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-[11px] uppercase font-bold text-slate-500">Score</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selectedSubmission.score}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-[11px] uppercase font-bold text-slate-500">Runtime / Memory</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selectedSubmission.displayRuntime || selectedSubmission.statusRuntime || '-'} / {selectedSubmission.statusMemory || '-'}</div>
                  </div>
                </div>

                {selectedSubmission.statusMsg && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5" />
                    <span>{selectedSubmission.statusMsg}</span>
                  </div>
                )}

                {(selectedSubmission.compileError || selectedSubmission.fullCompileError) && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                    <div className="text-sm font-semibold text-rose-700 mb-2">Compile Error</div>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">{selectedSubmission.fullCompileError || selectedSubmission.compileError}</pre>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-2">Code</div>
                  <pre className="rounded-xl bg-slate-900 text-slate-100 p-3 text-xs overflow-auto whitespace-pre-wrap break-words">{selectedSubmission.codeContent}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
};

export default MySubmissionsPage;
