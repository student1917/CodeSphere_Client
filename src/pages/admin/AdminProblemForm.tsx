import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import Loading from '@/components/Loading';
import { adminApi } from '@/apis/admin.api';
import { categoryApi } from '@/apis/category.api';
import { languageApi } from '@/apis/language.api';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/Editor/RichTextEditor';
import ConfirmModal from '@/components/Modal/ConfirmModal';
import { FiAlertTriangle } from 'react-icons/fi';

const AdminProblemForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');

  const [form, setForm] = useState<any>({
    code: '', title: '', content: '', level: 'EASY',
    timeLimitMs: 2000, memoryLimitMb: 256,
    categoryIds: [], languageIds: [],
    isPublic: true,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  
  // Dropdown states
  const [categorySearch, setCategorySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when id changes
    setDescription('');
    setConstraints('');
    setForm({
      code: '', title: '', content: '', level: 'EASY',
      timeLimitMs: 2000, memoryLimitMb: 256,
      categoryIds: [], languageIds: [],
      isPublic: true,
    });

    (async () => {
      try {
        const [cats, langs] = await Promise.all([
          categoryApi.getAllCategories(),
          languageApi.getAllLanguages(),
        ]);
        setCategories(Array.isArray(cats) ? cats : (cats as any)?.content || []);
        setLanguages(Array.isArray(langs) ? langs : (langs as any)?.content || []);
        
        if (isEdit && id) {
          const data = await adminApi.getProblem(Number(id));
          console.log('Loading problem data:', { id, hasContent: !!data.content, contentLength: data.content?.length });
          
          // Lưu original data để so sánh khi submit
          setOriginalData(data);
          
          setForm({
            code: data.code || '',
            title: data.title || '',
            content: data.content || '',
            level: data.level || 'EASY',
            timeLimitMs: data.timeLimitMs ?? 2000,
            memoryLimitMb: data.memoryLimitMb ?? 256,
            categoryIds: (data.categories||[]).map((c:any)=>c.id),
            languageIds: (data.languages||[]).map((l:any)=>l.id),
            isPublic: data.isPublic ?? true,
          });
          
          // Parse HTML content to extract description and constraints
          if (data.content) {
            console.log('Raw content preview:', data.content.substring(0, 200));
            const { parsedDescription, parsedConstraints } = parseHTMLContent(data.content);
            console.log('Parsed result:', { 
              descLength: parsedDescription.length, 
              constraintsLength: parsedConstraints.length,
              descPreview: parsedDescription.substring(0, 100),
              constraintsPreview: parsedConstraints.substring(0, 100)
            });
            setDescription(parsedDescription || '');
            setConstraints(parsedConstraints || '');
          } else {
            setDescription('');
            setConstraints('');
          }
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const parseHTMLContent = (html: string) => {
    if (!html || typeof html !== 'string') {
      console.warn('parseHTMLContent: Invalid HTML input');
      return { parsedDescription: '', parsedConstraints: '' };
    }

    let parsedDescription = '';
    let parsedConstraints = '';
    
    // Try using DOMParser for better HTML parsing
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try to find description div
      const descDiv = doc.querySelector('.problem-description') || doc.querySelector('div[class*="problem-description"]');
      if (descDiv) {
        parsedDescription = descDiv.innerHTML.trim();
        // Remove our custom classes, Quill will handle styling
        parsedDescription = parsedDescription.replace(/class="problem-[^"]*"/g, '');
        parsedDescription = parsedDescription.replace(/class='problem-[^']*'/g, '');
      }
      
      // Try to find constraints div
      const constraintsDiv = doc.querySelector('.problem-constraints');
      if (constraintsDiv) {
        // Get the inner content div (skip the "Constraints:" header and time/memory limits)
        // Structure: <div class="problem-constraints"><p>Constraints:</p><div><div>USER_CONTENT</div><div>Time/Memory</div></div></div>
        const contentDiv = constraintsDiv.querySelector('div > div');
        if (contentDiv) {
          // Get the first child div which contains user constraints (before time/memory limits)
          const firstChildDiv = contentDiv.firstElementChild;
          if (firstChildDiv && firstChildDiv.tagName === 'DIV') {
            parsedConstraints = firstChildDiv.innerHTML.trim();
          } else {
            // Fallback: get all text content but exclude time/memory limit divs
            const allDivs = contentDiv.querySelectorAll('div');
            if (allDivs.length > 0) {
              // Get first div that doesn't contain "Time Limit" or "Memory Limit"
              for (let i = 0; i < allDivs.length; i++) {
                const divText = allDivs[i].textContent || '';
                if (!divText.includes('Time Limit') && !divText.includes('Memory Limit')) {
                  parsedConstraints = allDivs[i].innerHTML.trim();
                  break;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('DOMParser failed, using regex fallback:', e);
    }
    
    // Fallback 1: Regex with depth counting for description
    if (!parsedDescription) {
      const descStartMatch = html.match(/<div[^>]*class=["']?[^"']*problem-description[^"']*["']?[^>]*>/i);
      if (descStartMatch) {
        const startIndex = descStartMatch.index! + descStartMatch[0].length;
        
        // Find the matching closing div by counting depth
        let depth = 1;
        let i = startIndex;
        while (i < html.length && depth > 0) {
          if (html.substring(i).match(/^<div[^>]*>/i)) {
            depth++;
            i += html.substring(i).match(/^<div[^>]*>/i)![0].length;
          } else if (html.substring(i).startsWith('</div>')) {
            depth--;
            if (depth === 0) {
              parsedDescription = html.substring(startIndex, i).trim();
              break;
            }
            i += 6;
          } else {
            i++;
          }
        }
      }
    }
    
    // Fallback 2: Simple regex for description
    if (!parsedDescription) {
      const simpleMatch = html.match(/<div[^>]*class=["']?[^"']*problem-description[^"']*["']?[^>]*>(.*?)<\/div>/is);
      if (simpleMatch && simpleMatch[1]) {
        parsedDescription = simpleMatch[1].trim();
        // Remove custom classes
        parsedDescription = parsedDescription.replace(/class="problem-[^"]*"/g, '');
        parsedDescription = parsedDescription.replace(/class='problem-[^']*'/g, '');
      }
    }
    
    // Fallback 3: If still empty, try to extract any content between div tags
    if (!parsedDescription) {
      console.warn('Could not parse description with standard methods, trying alternative');
      // Try to get content from the first meaningful div
      const altMatch = html.match(/<div[^>]*>(.*?)<\/div>/is);
      if (altMatch && altMatch[1] && !altMatch[1].includes('problem-constraints')) {
        parsedDescription = altMatch[1].trim();
      }
    }

    // Fallback for constraints: regex
    if (!parsedConstraints) {
      // Try multiple patterns for constraints
      // Pattern 1: Standard structure
      let constraintsMatch = html.match(/<div[^>]*class=["']?[^"']*problem-constraints[^"']*["']?[^>]*>(.*?)<\/div>\s*<\/div>\s*<\/div>/is);
      if (constraintsMatch) {
        const constraintsHtml = constraintsMatch[1];
        // Get content before time/memory limits
        const contentMatch = constraintsHtml.match(/<div[^>]*>\s*<div[^>]*>(.*?)<\/div>/is);
        if (contentMatch && contentMatch[1]) {
          // Remove time/memory limit section
          let userContent = contentMatch[1];
          // Remove the time/memory limit div if present
          userContent = userContent.replace(/<div[^>]*>.*?Time Limit.*?<\/div>/is, '');
          userContent = userContent.replace(/<div[^>]*>.*?Memory Limit.*?<\/div>/is, '');
          parsedConstraints = userContent.trim();
        }
      }
      
      // Pattern 2: Simpler structure
      if (!parsedConstraints) {
        constraintsMatch = html.match(/<div[^>]*class=["']?[^"']*problem-constraints[^"']*["']?[^>]*>.*?<div[^>]*>.*?<div[^>]*>(.*?)<\/div>/is);
        if (constraintsMatch && constraintsMatch[1]) {
          let userContent = constraintsMatch[1];
          // Remove time/memory limit section
          userContent = userContent.replace(/<div[^>]*>.*?Time Limit.*?<\/div>/is, '');
          userContent = userContent.replace(/<div[^>]*>.*?Memory Limit.*?<\/div>/is, '');
          parsedConstraints = userContent.trim();
        }
      }
    }

    console.log('Parsed description length:', parsedDescription.length);
    console.log('Parsed constraints length:', parsedConstraints.length);
    if (parsedDescription.length === 0) {
      console.warn('Description is empty after parsing. HTML:', html.substring(0, 500));
    }
    if (parsedConstraints.length === 0) {
      console.warn('Constraints is empty after parsing. HTML:', html.substring(0, 500));
    }

    return { parsedDescription, parsedConstraints };
  };

  const generateProfessionalHTML = () => {
    // ReactQuill returns HTML directly, just need to add styling classes
    let processedDescription = description || '';
    
    // Quill already returns HTML, so we just need to add our custom classes
    // Replace existing tags with our styled versions
    processedDescription = processedDescription.replace(/<strong>/g, '<strong class="problem-bold">');
    processedDescription = processedDescription.replace(/<em>/g, '<em class="problem-italic">');
    processedDescription = processedDescription.replace(/<code>/g, '<code class="problem-code">');
    processedDescription = processedDescription.replace(/<h1>/g, '<h1 class="problem-h1">');
    processedDescription = processedDescription.replace(/<h2>/g, '<h2 class="problem-h2">');
    processedDescription = processedDescription.replace(/<h3>/g, '<h3 class="problem-h3">');
    
    // Wrap paragraphs if they're not already wrapped
    processedDescription = processedDescription.replace(/<p>/g, '<p class="problem-paragraph">');
    
    // If content doesn't have paragraph tags, wrap it
    if (!processedDescription.includes('<p>') && !processedDescription.includes('<h1') && !processedDescription.includes('<h2') && !processedDescription.includes('<h3')) {
      // Split by double newlines and wrap each as paragraph
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
              Time Limit: ${form.timeLimitMs}ms
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Memory Limit: ${form.memoryLimitMb}MB
            </div>
          </div>
        </div>
      </div>`;

    return html;
  };

  const generateCodeFromTitle = (title: string): string => {
    if (!title) return '';
    const normalizeVietnamese = (str: string): string => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    };
    let normalized = normalizeVietnamese(title).toUpperCase();
    return normalized
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleChange = (k: string, v: any) => {
    setForm((s:any) => {
      const newForm = { ...s, [k]: v };
      if (k === 'title' && !isEdit && !codeManuallyEdited) {
        const generatedCode = generateCodeFromTitle(v);
        if (generatedCode) newForm.code = generatedCode;
      }
      if (k === 'code') setCodeManuallyEdited(true);
      return newForm;
    });
  };

  const handleToggleCategory = (categoryId: number) => {
    if (form.categoryIds.includes(categoryId)) {
      handleChange('categoryIds', form.categoryIds.filter((id: number) => id !== categoryId));
    } else {
      handleChange('categoryIds', [...form.categoryIds, categoryId]);
    }
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const handleToggleLanguage = (languageId: number) => {
    if (form.languageIds.includes(languageId)) {
      handleChange('languageIds', form.languageIds.filter((id: number) => id !== languageId));
    } else {
      handleChange('languageIds', [...form.languageIds, languageId]);
    }
    setLanguageSearch('');
    setShowLanguageDropdown(false);
  };

  const handleRemoveCategory = (categoryId: number) => {
    handleChange('categoryIds', form.categoryIds.filter((id: number) => id !== categoryId));
  };

  const handleRemoveLanguage = (languageId: number) => {
    handleChange('languageIds', form.languageIds.filter((id: number) => id !== languageId));
  };

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredLanguages = languages.filter(l =>
    l.name?.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const [originalData, setOriginalData] = useState<any>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Kiểm tra nếu đang thay đổi từ contest-only (isPublic = false) sang public (isPublic = true)
    if (isEdit && originalData) {
      const changingToPublic = form.isPublic && !originalData.isPublic;
      
      if (changingToPublic) {
        setShowWarningModal(true);
        return;
      }
    }
    
    handleSaveProblem();
  };

  const handleSaveProblem = async () => {
    
    const finalContent = generateProfessionalHTML();

    if (!form.title || !description) {
      toast.error('Title and Description are required');
      return;
    }
    
    const problemData = {
      ...form,
      content: finalContent,
    };

    if (!problemData.code || !isEdit) {
      const generatedCode = generateCodeFromTitle(problemData.title);
      if (!generatedCode) {
        toast.error('Could not generate code from title.');
        return;
      }
      problemData.code = generatedCode;
    }

    if (!problemData.categoryIds?.length) {
      toast.error('At least 1 category must be selected');
      return;
    }

    if (!problemData.languageIds?.length) {
      toast.error('At least 1 language must be selected');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await adminApi.updateProblem(Number(id), problemData);
        toast.success('Problem updated successfully');
      } else {
        await adminApi.createProblem(problemData);
        toast.success('Problem created successfully');
      }
      navigate('/admin/problems');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmWarning = () => {
    setShowWarningModal(false);
    handleSaveProblem();
  };

  if (loading) return <Container><div className="py-12"><Loading /></div></Container>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
    <Container>
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-blue-600">{isEdit ? 'Edit Problem' : 'Create Problem'}</h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/problems')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Problem'}
              </button>
            </div>
      </div>

          <div className="p-6 space-y-6">
            {/* Title */}
        <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
          <input 
                type="text"
            value={form.title} 
                onChange={e => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter problem title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                height="500px"
              />
        </div>
        
            {/* Constraints */}
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Constraints</label>
              <RichTextEditor
                value={constraints}
                onChange={setConstraints}
                height="150px"
              />
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <select
                  value={form.level}
                  onChange={e => handleChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
                <select
                  value={form.isPublic ? 'PUBLIC' : 'HIDDEN'}
                  onChange={e => {
                    const val = e.target.value;
                    handleChange('isPublic', val === 'PUBLIC');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {form.isPublic 
                    ? 'Problem will appear in public problem list'
                    : 'Problem will be hidden from public list (contest-only)'}
                </p>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (ms)</label>
            <input 
              type="number" 
              value={form.timeLimitMs} 
                  onChange={e => handleChange('timeLimitMs', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Memory Limit (MB)</label>
            <input 
              type="number" 
              value={form.memoryLimitMb} 
                  onChange={e => handleChange('memoryLimitMb', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
          </div>
        </div>

            {/* Categories */}
        <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categories</label>
              <div className="space-y-3">
                {/* Selected Categories */}
                {form.categoryIds.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {form.categoryIds.map((catId: number) => {
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
                
                {/* Category Search Dropdown */}
                <div className="relative" ref={categoryRef}>
                      <input
                    type="text"
                    placeholder="Search or select category..."
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
                            disabled={form.categoryIds.includes(cat.id)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                              form.categoryIds.includes(cat.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {cat.name}
                            {form.categoryIds.includes(cat.id) && (
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed Languages</label>
              <div className="space-y-3">
                {form.languageIds.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {form.languageIds.map((langId: number) => {
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
                    placeholder="Search or select language..."
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
                            disabled={form.languageIds.includes(lang.id)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                              form.languageIds.includes(lang.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {lang.name} {lang.version && `(${lang.version})`}
                            {form.languageIds.includes(lang.id) && (
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
      </Container>

      {/* Warning Modal */}
      <ConfirmModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleConfirmWarning}
        title="Warning"
        message="This problem is currently used in contests. Changing it to public will make it visible to all users.\n\nIf any OFFICIAL contests are still ongoing or upcoming, this change will be blocked.\n\nDo you want to continue?"
        confirmText="Continue"
        cancelText="Cancel"
        confirmButtonColor="blue"
        icon={
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <FiAlertTriangle className="text-amber-600" size={24} />
          </div>
        }
      />
    </div>
  );
};

export default AdminProblemForm;
