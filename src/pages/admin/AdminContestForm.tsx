import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import { adminApi } from '@/apis/admin.api';
import { categoryApi } from '@/apis/category.api';
import { tagApi } from '@/apis/tag.api';
import { languageApi } from '@/apis/language.api';
import toast from 'react-hot-toast';
import type { CreateContestRequest } from '@/types/contest.types';
import type { ProblemResponse } from '@/types/problem.types';
import { FiX, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';
import RichTextEditor from '@/components/Editor/RichTextEditor';

const AdminContestForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<Array<{ problemId: number; order: string; points: number }>>([]);
  const [problemSearch, setProblemSearch] = useState('');
  const [problemFilter, setProblemFilter] = useState<'ALL' | 'CONTEST_ONLY' | 'PUBLIC'>('ALL');
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [showCreateProblem, setShowCreateProblem] = useState(false);
  const [creatingProblem, setCreatingProblem] = useState(false);
  
  // Các trường mới để hỗ trợ format tự động trong modal tạo problem
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');

  // Form tạo bài tập mới
  const [newProblemForm, setNewProblemForm] = useState({
    code: '',
    title: '',
    content: '',
    level: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    categoryIds: [] as number[],
    tagIds: [] as number[],
    languageIds: [] as number[],
    isPublic: false,
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  
  // Dropdown states for new problem modal
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CreateContestRequest>({
    title: '',
    description: '',
    contestType: 'OFFICIAL' as 'PRACTICE' | 'OFFICIAL',
    durationMinutes: undefined,
    startTime: '',
    endTime: '',
    registrationStartTime: '',
    registrationEndTime: '',
    isPublic: true,
    accessCode: '',
    problems: [],
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await adminApi.getProblems(0, 1000);
        const problemsList = (data as any)?.content || (Array.isArray(data) ? data : []);
        // Fetch all problems, not just contest problems
        setProblems(problemsList);
      } catch (e: any) {
        console.error(e);
        toast.error('Failed to fetch problems list');
      }
    };
    
    const fetchMetadata = async () => {
      try {
        const [cats, t, langs] = await Promise.all([
          categoryApi.getAllCategories(),
          tagApi.getAllTags(),
          languageApi.getAllLanguages(),
        ]);
        setCategories(Array.isArray(cats) ? cats : (cats as any)?.content || []);
        setTags(Array.isArray(t) ? t : (t as any)?.content || []);
        setLanguages(Array.isArray(langs) ? langs : (langs as any)?.content || []);
      } catch (e: any) {
        console.error(e);
      }
    };

    const fetchContest = async () => {
      if (isEdit && id) {
        try {
          const contest = await adminApi.getContestById(Number(id));
          const convertToDateTimeLocal = (isoString: string | null | undefined): string => {
            if (!isoString) return '';
            const date = new Date(isoString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          };

          setForm({
            title: contest.title || '',
            description: contest.description || '',
            contestType: contest.contestType || 'OFFICIAL',
            durationMinutes: contest.durationMinutes,
            startTime: convertToDateTimeLocal(contest.startTime),
            endTime: convertToDateTimeLocal(contest.endTime),
            registrationStartTime: convertToDateTimeLocal(contest.registrationStartTime),
            registrationEndTime: convertToDateTimeLocal(contest.registrationEndTime),
            isPublic: contest.isPublic,
            accessCode: contest.hasAccessCode ? '' : undefined,
            problems: [],
          });

          if (contest.problems && contest.problems.length > 0) {
            // Fetch full problem details for problems in the contest
            const problemDetailsPromises = contest.problems.map(async (p: any) => {
              try {
                const problemDetail = await adminApi.getProblem(p.problemId);
                return problemDetail;
              } catch (e: any) {
                // If admin API fails, try common API
                try {
                  const { problemApi } = await import('@/apis/problem.api');
                  return await problemApi.getProblemDetail(p.problemId);
                } catch (err) {
                  console.error(`Failed to fetch problem ${p.problemId}:`, err);
                  return null;
                }
              }
            });

            const problemDetails = await Promise.all(problemDetailsPromises);
            const validProblems = problemDetails.filter(p => p !== null);
            
            // Add problems to the problems list if they're not already there
            setProblems((prev) => {
              const existingIds = new Set(prev.map(p => p.id));
              const newProblems = validProblems.filter(p => !existingIds.has(p.id));
              return [...prev, ...newProblems];
            });

            setSelectedProblems(
              contest.problems.map((p) => ({
                problemId: p.problemId,
                order: p.order,
                points: p.points,
              }))
            );
          }
        } catch (e: any) {
          toast.error('Failed to fetch contest info');
        }
      }
    };

    (async () => {
      setLoading(true);
      await Promise.all([fetchProblems(), fetchContest(), fetchMetadata()]);
      setLoading(false);
    })();
  }, [id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (tagRef.current && !tagRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (key: keyof CreateContestRequest, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddProblem = (problem: ProblemResponse) => {
    const nextOrder = String.fromCharCode(65 + selectedProblems.length);
    setSelectedProblems((prev) => [
      ...prev,
      {
        problemId: problem.id!,
        order: nextOrder,
        points: 100,
      },
    ]);
    setShowProblemSelector(false);
    setProblemSearch('');
  };


  const generateProfessionalHTML = () => {
    // ReactQuill returns HTML directly, just need to add styling classes
    let processedDescription = description || '';
    
    // Quill already returns HTML, so we just need to add our custom classes
    processedDescription = processedDescription.replace(/<strong>/g, '<strong class="problem-bold">');
    processedDescription = processedDescription.replace(/<em>/g, '<em class="problem-italic">');
    processedDescription = processedDescription.replace(/<code>/g, '<code class="problem-code">');
    processedDescription = processedDescription.replace(/<h1>/g, '<h1 class="problem-h1">');
    processedDescription = processedDescription.replace(/<h2>/g, '<h2 class="problem-h2">');
    processedDescription = processedDescription.replace(/<h3>/g, '<h3 class="problem-h3">');
    processedDescription = processedDescription.replace(/<p>/g, '<p class="problem-paragraph">');
    
    // If content doesn't have paragraph tags, wrap it
    if (!processedDescription.includes('<p>') && !processedDescription.includes('<h1') && !processedDescription.includes('<h2') && !processedDescription.includes('<h3')) {
      const paragraphs = processedDescription.split(/\n\s*\n/).filter(p => p.trim());
      processedDescription = paragraphs.map(p => `<p class="problem-paragraph">${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    
    let html = `<div class="problem-description">${processedDescription}</div>`;

    html += `
      <div class="problem-constraints">
        <p class="font-semibold text-slate-800 mb-2">Constraints:</p>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 space-y-3">
          ${constraints ? `<div>${constraints}</div>` : ''}
          <div class="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-slate-200 mt-1">
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Time Limit: ${newProblemForm.timeLimitMs}ms
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Memory Limit: ${newProblemForm.memoryLimitMb}MB
            </div>
          </div>
        </div>
      </div>`;

    return html;
  };

  const handleCreateAndAddProblem = async () => {
    if (!newProblemForm.title || !description) {
      toast.error('Title and Description are required');
      return;
    }

    const finalContent = generateProfessionalHTML();
    
    let finalCode = newProblemForm.code;
    if (!finalCode) {
      const generateCode = (title: string): string => {
        if (!title) return '';
        const normalizeVietnamese = (str: string): string => {
          return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        };
        let normalized = normalizeVietnamese(title).toUpperCase();
        return normalized.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      };
      finalCode = generateCode(newProblemForm.title);
      if (!finalCode) {
        toast.error('Could not generate code from title.');
        return;
      }
    }

    if (!newProblemForm.categoryIds || newProblemForm.categoryIds.length === 0) {
      toast.error('At least 1 category must be selected');
      return;
    }
    if (!newProblemForm.languageIds || newProblemForm.languageIds.length === 0) {
      toast.error('At least 1 language must be selected');
      return;
    }

    setCreatingProblem(true);
    try {
      const createdProblem = await adminApi.createProblem({
        ...newProblemForm,
        code: finalCode,
        content: finalContent,
        isPublic: false, // Tự động set false khi tạo trong contest (contest-only)
      });

      setProblems((prev) => [...prev, createdProblem]);

      const nextOrder = String.fromCharCode(65 + selectedProblems.length);
      setSelectedProblems((prev) => [
        ...prev,
        {
          problemId: createdProblem.id!,
          order: nextOrder,
          points: 100,
        },
      ]);

      setNewProblemForm({
        code: '', title: '', content: '', level: 'EASY',
        timeLimitMs: 2000, memoryLimitMb: 256,
        categoryIds: [], tagIds: [], languageIds: [],
        isPublic: false,
      });
      setDescription('');
      setConstraints('');
      setShowCreateProblem(false);
      toast.success('Problem created and added to contest successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to create problem');
    } finally {
      setCreatingProblem(false);
    }
  };

  const handleRemoveProblem = (index: number) => {
    setSelectedProblems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProblem = (index: number, field: 'order' | 'points', value: string | number) => {
    setSelectedProblems((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const filteredProblems = problems.filter(
    (p) => {
      // Skip if already selected
      if (selectedProblems.some((sp) => sp.problemId === p.id)) {
        return false;
      }
      
      // Filter theo loại
      if (problemFilter === 'CONTEST_ONLY') {
        if (p.isPublic) return false; // Chỉ hiện non-public (contest-only)
      } else if (problemFilter === 'PUBLIC') {
        if (!p.isPublic) return false; // Chỉ hiện public
      }
      // 'ALL' thì không filter
      
      // Search filter
      if (problemSearch.trim() !== '') {
        const searchLower = problemSearch.toLowerCase();
        const titleMatch = p.title?.toLowerCase().includes(searchLower) ?? false;
        const codeMatch = p.code?.toLowerCase().includes(searchLower) ?? false;
        return titleMatch || codeMatch;
      }
      
      return true;
    }
  );

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredTags = tags.filter(t =>
    t.name?.toLowerCase().includes(tagSearch.toLowerCase())
  );
  const filteredLanguages = languages.filter(l =>
    l.name?.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const handleToggleCategory = (categoryId: number) => {
    if (newProblemForm.categoryIds.includes(categoryId)) {
      setNewProblemForm(p => ({ ...p, categoryIds: p.categoryIds.filter(id => id !== categoryId) }));
    } else {
      setNewProblemForm(p => ({ ...p, categoryIds: [...p.categoryIds, categoryId] }));
    }
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const handleToggleTag = (tagId: number) => {
    if (newProblemForm.tagIds.includes(tagId)) {
      setNewProblemForm(p => ({ ...p, tagIds: p.tagIds.filter(id => id !== tagId) }));
    } else {
      setNewProblemForm(p => ({ ...p, tagIds: [...p.tagIds, tagId] }));
    }
    setTagSearch('');
    setShowTagDropdown(false);
  };

  const handleToggleLanguage = (languageId: number) => {
    if (newProblemForm.languageIds.includes(languageId)) {
      setNewProblemForm(p => ({ ...p, languageIds: p.languageIds.filter(id => id !== languageId) }));
    } else {
      setNewProblemForm(p => ({ ...p, languageIds: [...p.languageIds, languageId] }));
    }
    setLanguageSearch('');
    setShowLanguageDropdown(false);
  };

  const handleRemoveCategory = (categoryId: number) => {
    setNewProblemForm(p => ({ ...p, categoryIds: p.categoryIds.filter(id => id !== categoryId) }));
  };

  const handleRemoveTag = (tagId: number) => {
    setNewProblemForm(p => ({ ...p, tagIds: p.tagIds.filter(id => id !== tagId) }));
  };

  const handleRemoveLanguage = (languageId: number) => {
    setNewProblemForm(p => ({ ...p, languageIds: p.languageIds.filter(id => id !== languageId) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title) {
      toast.error('Title is required');
      return;
    }

    if (!form.contestType) {
      toast.error('Contest type is required');
      return;
    }

    if (form.contestType === 'PRACTICE') {
      if (!form.durationMinutes || form.durationMinutes <= 0) {
        toast.error('PRACTICE contest must have durationMinutes > 0');
        return;
      }
    } else if (form.contestType === 'OFFICIAL') {
      if (!form.startTime || !form.endTime) {
        toast.error('OFFICIAL contest must have startTime and endTime');
        return;
      }
    }

    if (!form.isPublic && !form.accessCode) {
      toast.error('Private contest must have an access code');
      return;
    }

    if (selectedProblems.length === 0) {
      toast.error('Contest must have at least 1 problem');
      return;
    }

    setSaving(true);
    try {
      const convertToISO = (datetimeLocal: string): string => {
        if (!datetimeLocal) return '';
        const date = new Date(datetimeLocal);
        return date.toISOString();
      };

      const payload: CreateContestRequest = {
        ...form,
        startTime: form.contestType === 'OFFICIAL' ? convertToISO(form.startTime || '') : null,
        endTime: form.contestType === 'OFFICIAL' ? convertToISO(form.endTime || '') : null,
        registrationStartTime: form.registrationStartTime ? convertToISO(form.registrationStartTime) : null,
        registrationEndTime: form.registrationEndTime ? convertToISO(form.registrationEndTime) : null,
        durationMinutes: form.contestType === 'PRACTICE' ? form.durationMinutes : undefined,
        problems: selectedProblems.map((sp) => ({
          problemId: sp.problemId,
          order: sp.order,
          points: sp.points,
        })),
      };

      if (isEdit && id) {
        await adminApi.updateContest(Number(id), payload);
        toast.success('Contest updated successfully');
      } else {
        await adminApi.createContest(payload);
        toast.success('Contest created successfully');
      }
      navigate('/admin/contests');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container><div className="py-12"><Loading /></div></Container>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-blue-600">{isEdit ? 'Edit Contest' : 'Create Contest'}</h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/contests')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Contest'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Weekly Coding Challenge #1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell participants about this contest..."
              />
            </div>

            {/* Contest Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contest Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleChange('contestType', 'OFFICIAL');
                    handleChange('durationMinutes', undefined);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    form.contestType === 'OFFICIAL'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold mb-1">Official</div>
                  <div className="text-xs text-gray-500">Fixed global start & end time</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('contestType', 'PRACTICE');
                    handleChange('startTime', '');
                    handleChange('endTime', '');
                    handleChange('durationMinutes', 120);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    form.contestType === 'PRACTICE'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold mb-1">Practice</div>
                  <div className="text-xs text-gray-500">Participants start whenever they want</div>
                </button>
              </div>
            </div>

            {/* Time Settings */}
            {form.contestType === 'OFFICIAL' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={form.startTime || ''}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={form.endTime || ''}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Minutes)</label>
                <input
                  type="number"
                  value={form.durationMinutes || ''}
                  onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 120"
                  required
                />
              </div>
            )}

            {/* Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
                <select
                  value={form.isPublic ? 'PUBLIC' : 'PRIVATE'}
                  onChange={(e) => handleChange('isPublic', e.target.value === 'PUBLIC')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              {!form.isPublic && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Access Code</label>
                  <input
                    type="text"
                    value={form.accessCode || ''}
                    onChange={(e) => handleChange('accessCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter private code..."
                    required={!form.isPublic}
                  />
                </div>
              )}
            </div>

            {/* Problems Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700">Contest Problems</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateProblem(true)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    Create New
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProblemSelector(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Existing
                  </button>
                </div>
              </div>

              {selectedProblems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <FiFileText size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No problems selected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProblems.map((sp, index) => {
                    const problem = problems.find((p) => p.id === sp.problemId);
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-semibold text-gray-600">
                          {sp.order}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{problem?.title || `Problem ID: ${sp.problemId}`}</div>
                          <div className="text-xs text-gray-500">{problem?.level} • {problem?.code}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500 text-center">Points</label>
                            <input
                              type="number"
                              value={sp.points}
                              onChange={(e) => handleUpdateProblem(index, 'points', Number(e.target.value))}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProblem(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Create New Problem Modal */}
      {showCreateProblem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-blue-600">Create Contest Problem</h3>
              <button
                type="button"
                onClick={() => setShowCreateProblem(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newProblemForm.title}
                    onChange={(e) => setNewProblemForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter problem title..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                    <select
                      value={newProblemForm.level}
                      onChange={(e) => setNewProblemForm(p => ({ ...p, level: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time (ms)</label>
                    <input
                      type="number"
                      value={newProblemForm.timeLimitMs}
                      onChange={(e) => setNewProblemForm(p => ({ ...p, timeLimitMs: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">RAM (MB)</label>
                    <input
                      type="number"
                      value={newProblemForm.memoryLimitMb}
                      onChange={(e) => setNewProblemForm(p => ({ ...p, memoryLimitMb: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  height="400px"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Constraints</label>
                <RichTextEditor
                  value={constraints}
                  onChange={setConstraints}
                  height="150px"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categories</label>
                  <div className="space-y-3">
                    {newProblemForm.categoryIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {newProblemForm.categoryIds.map((catId: number) => {
                          const cat = categories.find(c => c.id === catId);
                          return cat ? (
                            <div
                              key={catId}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm border border-blue-300"
                            >
                              <span>{cat.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(catId)}
                                className="ml-1 text-blue-700 hover:text-blue-900 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="relative" ref={categoryRef}>
                      <input
                        type="text"
                        placeholder="Search category..."
                        value={categorySearch}
                        onChange={e => {
                          setCategorySearch(e.target.value);
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showCategoryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredCategories.length === 0 ? (
                            <div className="p-3 text-sm text-gray-400 text-center">No category found</div>
                          ) : (
                            filteredCategories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleToggleCategory(cat.id)}
                                disabled={newProblemForm.categoryIds.includes(cat.id)}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                  newProblemForm.categoryIds.includes(cat.id)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {cat.name}
                                {newProblemForm.categoryIds.includes(cat.id) && (
                                  <span className="ml-2 text-xs text-gray-400">(selected)</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                  <div className="space-y-3">
                    {newProblemForm.tagIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {newProblemForm.tagIds.map((tagId: number) => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <div
                              key={tagId}
                              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm border border-green-300"
                            >
                              <span>{tag.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tagId)}
                                className="ml-1 text-green-700 hover:text-green-900 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="relative" ref={tagRef}>
                      <input
                        type="text"
                        placeholder="Search tag..."
                        value={tagSearch}
                        onChange={e => {
                          setTagSearch(e.target.value);
                          setShowTagDropdown(true);
                        }}
                        onFocus={() => setShowTagDropdown(true)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showTagDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredTags.length === 0 ? (
                            <div className="p-3 text-sm text-gray-400 text-center">No tag found</div>
                          ) : (
                            filteredTags.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleTag(tag.id)}
                                disabled={newProblemForm.tagIds.includes(tag.id)}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                  newProblemForm.tagIds.includes(tag.id)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {tag.name}
                                {newProblemForm.tagIds.includes(tag.id) && (
                                  <span className="ml-2 text-xs text-gray-400">(selected)</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Languages</label>
                  <div className="space-y-3">
                    {newProblemForm.languageIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {newProblemForm.languageIds.map((langId: number) => {
                          const lang = languages.find(l => l.id === langId);
                          return lang ? (
                            <div
                              key={langId}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm border border-purple-300"
                            >
                              <span>{lang.name} {lang.version && `(${lang.version})`}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLanguage(langId)}
                                className="ml-1 text-purple-700 hover:text-purple-900 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="relative" ref={languageRef}>
                      <input
                        type="text"
                        placeholder="Search language..."
                        value={languageSearch}
                        onChange={e => {
                          setLanguageSearch(e.target.value);
                          setShowLanguageDropdown(true);
                        }}
                        onFocus={() => setShowLanguageDropdown(true)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showLanguageDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredLanguages.length === 0 ? (
                            <div className="p-3 text-sm text-gray-400 text-center">No language found</div>
                          ) : (
                            filteredLanguages.map((lang) => (
                              <button
                                key={lang.id}
                                type="button"
                                onClick={() => handleToggleLanguage(lang.id)}
                                disabled={newProblemForm.languageIds.includes(lang.id)}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                  newProblemForm.languageIds.includes(lang.id)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {lang.name} {lang.version && `(${lang.version})`}
                                {newProblemForm.languageIds.includes(lang.id) && (
                                  <span className="ml-2 text-xs text-gray-400">(selected)</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateProblem(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateAndAddProblem} disabled={creatingProblem} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {creatingProblem ? 'Creating...' : 'Create & Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problem Selector Modal */}
      {showProblemSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Select Problem</h3>
              <button 
                onClick={() => { 
                  setShowProblemSelector(false); 
                  setProblemSearch(''); 
                  setProblemFilter('ALL'); 
                }} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Filter và Search */}
              <div className="flex gap-3">
                <select
                  value={problemFilter}
                  onChange={(e) => setProblemFilter(e.target.value as 'ALL' | 'CONTEST_ONLY' | 'PUBLIC')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ALL">All Problems</option>
                  <option value="CONTEST_ONLY">Contest Only</option>
                  <option value="PUBLIC">Public Problems</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by title or code..."
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                {filteredProblems.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    {problemFilter === 'CONTEST_ONLY' 
                      ? 'No contest-only problems found' 
                      : problemFilter === 'PUBLIC'
                      ? 'No public problems found'
                      : 'No problems found'}
                  </div>
                ) : (
                  filteredProblems.map((problem) => (
                    <button 
                      key={problem.id} 
                      type="button" 
                      onClick={() => handleAddProblem(problem)} 
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {problem.title || `Problem ${problem.id}`}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {problem.code || `CODE_${problem.id}`} • {problem.level || 'N/A'}
                          </div>
                        </div>
                        <div className="ml-4">
                          {problem.isPublic ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                              Contest Only
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContestForm;
