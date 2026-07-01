import { useRef, useEffect, useState } from 'react';
import { Editor, DiffEditor } from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { FiMoon, FiSun } from 'react-icons/fi';
import { aiApi } from '@/apis/ai.api';
import type { ProblemDetailResponse } from '@/types/problem.types';
import type { RunCodeResponse, CustomTestCase } from '@/apis/submission.api';
import type { EditorTabType } from '../types';
import { setupCppValidation } from '../cppValidation';
import TestCasePanel from './TestCasePanel';
import ResultPanel from './ResultPanel';
import ReviewPanel from './ReviewPanel';

interface CodeEditorPanelProps {
  problem: ProblemDetailResponse;
  code: string;
  onCodeChange: (code: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  activeEditorTab: EditorTabType;
  onEditorTabChange: (tab: EditorTabType) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  editorTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  runResults: RunCodeResponse | null;
  // Refactor state
  showDiff: boolean;
  originalCode: string;
  refactoredCode: string;
  isRefactoring: boolean;
  onRefactor: () => Promise<void>;
  onAcceptRefactor: () => void;
  onCancelRefactor: () => void;
  // Review state
  isReviewing: boolean;
  onReview: () => Promise<void>;
  reviewResult: string | null;
  onRefactorSuggestions: (suggestions: string[]) => Promise<void>;
  // TestCase state
  sampleTestCases: any[];
  customTestCases: CustomTestCase[];
  selectedTestCaseIndex: number;
  onSelectTestCase: (index: number) => void;
  onAddCustomTestCase: () => void;
  onDeleteCustomTestCase: (index: number) => void;
  onUpdateCustomTestCase: (index: number, testCase: CustomTestCase) => void;
  // Contest mode
  contestId?: string | null;
}

const CodeEditorPanel = ({
  problem,
  code,
  onCodeChange,
  selectedLanguage,
  onLanguageChange,
  activeEditorTab,
  onEditorTabChange,
  isChatOpen,
  onToggleChat,
  editorTheme,
  onToggleTheme,
  runResults,
  showDiff,
  originalCode,
  refactoredCode,
  isRefactoring,
  onRefactor,
  onAcceptRefactor,
  onCancelRefactor,
  isReviewing,
  onReview,
  reviewResult,
  onRefactorSuggestions,
  sampleTestCases,
  customTestCases,
  selectedTestCaseIndex,
  onSelectTestCase,
  onAddCustomTestCase,
  onDeleteCustomTestCase,
  onUpdateCustomTestCase,
  contestId,
}: CodeEditorPanelProps) => {
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState('100%');

  useEffect(() => {
    const updateHeight = () => {
      if (editorContainerRef.current) {
        const height = editorContainerRef.current.offsetHeight;
        if (height > 0) {
          setEditorHeight(`${height}px`);
        }
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [activeEditorTab]);

  // Handle language-specific validation
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Clear all validation markers first
    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.editor.setModelMarkers(model, 'cpp-validator', []);
    }

    // Only setup C++ validation for C/C++ languages
    if ((selectedLanguage === 'cpp' || selectedLanguage === 'c') && typeof setupCppValidation === 'function') {
      setupCppValidation(editor, monaco);
    }
  }, [selectedLanguage]);

  const getMonacoLanguage = (lang: string) => {
    if (lang === 'cpp' || lang === 'c') return 'cpp';
    if (lang === 'python' || lang === 'py') return 'python';
    if (lang === 'java') return 'java';
    return lang;
  };

  const getEditorOptions = () => {
    const isLight = editorTheme === 'light';

    return {
      minimap: { enabled: false },
      fontSize: 16,
      lineHeight: 26,
      wordWrap: 'on' as const,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      readOnly: false,
      contextmenu: !contestId,
      selectionClipboard: !contestId,
      lineNumbers: 'on' as const,
      renderLineHighlight: 'all' as const,
      selectOnLineNumbers: true,
      roundedSelection: true,
      cursorStyle: 'line' as const,
      cursorBlinking: 'smooth' as const,
      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
      fontLigatures: false,
      letterSpacing: 0.5,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      bracketPairColorization: { enabled: true },
      colorDecorators: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      validate: true,
      glyphMargin: true,
      renderValidationDecorations: 'on' as const,
      folding: true,
      foldingStrategy: 'indentation' as const,
      showFoldingControls: 'always' as const,
      unfoldOnClickAfterEndOfLine: true,
      'editor.showFoldingControls': 'always' as const,
      'editor.parameterHints.enabled': true,
      'editor.quickSuggestions': {
        other: true,
        comments: false,
        strings: false,
      },
      'editor.semanticHighlighting.enabled': true,
      // Light/Dark theme colors
      'editor.background': isLight ? '#ffffff' : '#1e1e1e',
      'editor.foreground': isLight ? '#24292e' : '#e0e0e0',
      'editor.lineHighlightBackground': isLight ? '#f6f8fa' : '#2d2d30',
      'editor.selectionBackground': isLight ? '#b3d4fc' : '#264f78',
      'editor.inactiveSelectionBackground': isLight ? '#e5e5e5' : '#3f3f46',
      'editorCursor.foreground': isLight ? '#24292e' : '#aeafad',
      'editorWhitespace.foreground': isLight ? '#d1d5da' : '#464647',
      'editorIndentGuide.background': isLight ? '#d1d5da' : '#464647',
      'editorIndentGuide.activeBackground': isLight ? '#6a737d' : '#a9a9a9',
      'editorLineNumber.foreground': isLight ? '#959da5' : '#6a6a6a',
      'editorLineNumber.activeForeground': isLight ? '#24292e' : '#ffffff',
      'editor.foldBackground': isLight ? '#f6f8fa' : '#252526',
      'editorGutter.foldingControlForeground': isLight ? '#6a737d' : '#a9a9a9',
      'editor.tokenColorCustomizations': {
        textMateRules: [
          {
            scope: ['comment'],
            settings: { foreground: isLight ? '#6a737d' : '#6a9955', fontStyle: 'italic' }
          },
          {
            scope: ['keyword', 'storage.type', 'storage.modifier'],
            settings: { foreground: isLight ? '#d73a49' : '#569cd6', fontStyle: 'bold' }
          },
          {
            scope: ['keyword.control', 'keyword.operator'],
            settings: { foreground: isLight ? '#d73a49' : '#569cd6', fontStyle: 'bold' }
          },
          {
            scope: ['meta.preprocessor', 'entity.name.function.preprocessor', 'punctuation.definition.directive'],
            settings: { foreground: isLight ? '#6f42c1' : '#c586c0', fontStyle: 'bold' }
          },
          {
            scope: ['string', 'string.quoted'],
            settings: { foreground: isLight ? '#032f62' : '#ce9178' }
          },
          {
            scope: ['constant.numeric', 'constant.language'],
            settings: { foreground: isLight ? '#005cc5' : '#b5cea8' }
          },
          {
            scope: ['entity.name.function', 'entity.name.method'],
            settings: { foreground: isLight ? '#6f42c1' : '#dcdcaa' }
          },
          {
            scope: ['entity.name.class', 'entity.name.type'],
            settings: { foreground: isLight ? '#e36209' : '#4ec9b0' }
          },
          {
            scope: ['variable', 'variable.parameter'],
            settings: { foreground: isLight ? '#e36209' : '#9cdcfe' }
          },
          {
            scope: ['punctuation', 'meta.brace'],
            settings: { foreground: isLight ? '#24292e' : '#d4d4d4' }
          },
          {
            scope: ['support.type', 'support.class'],
            settings: { foreground: isLight ? '#005cc5' : '#4ec9b0' }
          }
        ]
      }
    };
  };

  return (
    <div className="flex flex-col bg-white border-l border-gray-200 h-full">
      {/* Editor Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={() => onEditorTabChange('code')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeEditorTab === 'code'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Code
          </button>
          <button
            onClick={() => onEditorTabChange('testcase')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeEditorTab === 'testcase'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Testcase
          </button>
          <button
            onClick={() => onEditorTabChange('result')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${activeEditorTab === 'result'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Result
            {runResults && (
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${runResults.success ? 'bg-green-500' : 'bg-red-500'
                }`} />
            )}
          </button>
          {!contestId && (
            <button
              onClick={() => onEditorTabChange('review')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${activeEditorTab === 'review'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Review
              {reviewResult && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          )}
        </div>
        {/* Theme Toggle & AI Chat Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="px-2 py-1.5 text-sm font-medium transition-colors text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
            title={`Switch to ${editorTheme === 'light' ? 'dark' : 'light'} mode`}
          >
            {editorTheme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
          </button>
          {!contestId && (
            <button
              onClick={onToggleChat}
              className={`px-3 py-1.5 text-sm font-medium transition-colors mr-2 ${isChatOpen
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              AI Chat
            </button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeEditorTab === 'code' && (
          <div className="h-full flex flex-col min-h-0">
            {/* Language Selector */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {problem.languages.map((lang) => (
                    <option key={lang.id} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <button className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Auto
                </button>
              </div>
              {/* Ẩn các nút AI khi đang trong contest */}
              {!contestId && (
                <div className="flex items-center gap-2">
                  {showDiff ? (
                    <>
                      <button
                        onClick={onAcceptRefactor}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Accept Changes
                      </button>
                      <button
                        onClick={onCancelRefactor}
                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onReview}
                        disabled={isReviewing || isRefactoring}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isReviewing ? 'Reviewing...' : 'Review Code'}
                      </button>
                      <button
                        onClick={onRefactor}
                        disabled={isRefactoring || isReviewing}
                        className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRefactoring ? 'Refactoring...' : 'Refactor'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Code Editor */}
            <div ref={editorContainerRef} className={`flex-1 min-h-0 relative ${editorTheme === 'light' ? 'bg-white' : 'bg-gray-900'}`} style={{ minHeight: '400px' }}>
              {showDiff ? (
                <DiffEditor
                  height={editorHeight}
                  language={getMonacoLanguage(selectedLanguage)}
                  original={originalCode}
                  modified={refactoredCode}
                  theme={editorTheme === 'light' ? 'vs' : 'vs-dark'}
                  options={{
                    readOnly: true,
                    renderSideBySide: false,
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              ) : (
                <Editor
                  height={editorHeight}
                  language={getMonacoLanguage(selectedLanguage)}
                  value={code}
                  onChange={(value) => onCodeChange(value || '')}
                  theme={editorTheme === 'light' ? 'vs' : 'vs-dark'}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;

                    editor.updateOptions({
                      readOnly: false,
                      contextmenu: !contestId, // Contest: tắt chuột phải
                    });

                    if (contestId) {
                      // Chặn Ctrl + C, V, X
                      editor.onKeyDown((e) => {
                        const ctrl = e.ctrlKey || e.metaKey;

                        // Chặn tất cả tổ hợp Ctrl + ...
                        if (ctrl) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      });

                      const dom = editor.getDomNode();

                      dom?.addEventListener("copy", (e) => e.preventDefault());
                      dom?.addEventListener("cut", (e) => e.preventDefault());
                      dom?.addEventListener("paste", (e) => e.preventDefault());
                    }

                    setTimeout(() => {
                      editor.layout();
                    }, 100);
                  }}
                  options={getEditorOptions()}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
              <span>Saved</span>
              <span>Ln 1, Col 1</span>
            </div>
          </div>
        )}

        {activeEditorTab === 'testcase' && (
          <TestCasePanel
            sampleTestCases={sampleTestCases}
            customTestCases={customTestCases}
            selectedTestCaseIndex={selectedTestCaseIndex}
            onSelectTestCase={onSelectTestCase}
            onAddCustomTestCase={onAddCustomTestCase}
            onDeleteCustomTestCase={onDeleteCustomTestCase}
            onUpdateCustomTestCase={onUpdateCustomTestCase}
            runResults={runResults}
          />
        )}

        {activeEditorTab === 'result' && (
          <ResultPanel runResults={runResults} />
        )}

        {activeEditorTab === 'review' && (
          <ReviewPanel
            reviewResult={reviewResult}
            isReviewing={isReviewing}
            code={code}
            problemId={problem.id}
            language={selectedLanguage}
            onRefactorSuggestions={onRefactorSuggestions}
            isRefactoring={isRefactoring}
          />
        )}
      </div>
    </div>
  );
};

export default CodeEditorPanel;

