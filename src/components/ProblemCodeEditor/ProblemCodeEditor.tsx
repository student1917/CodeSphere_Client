import { Editor, useMonaco } from '@monaco-editor/react';
import { useState, useEffect } from 'react';
import { FiSettings, FiMaximize2, FiBell, FiUser } from 'react-icons/fi';
import type { LanguageResponse } from '@/types/common.types';

interface ProblemCodeEditorProps {
  languages: LanguageResponse[];
  defaultLanguage?: string;
  initialCode?: string;
  onSubmit?: (code: string, language: string) => void;
  onTest?: (code: string, language: string) => void;
}

const ProblemCodeEditor = ({
  languages,
  defaultLanguage = 'cpp',
  initialCode = '',
  onSubmit,
  onTest,
}: ProblemCodeEditorProps) => {
  console.log('🔵 ProblemCodeEditor render:', { languages, defaultLanguage });
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage);
  const [code, setCode] = useState<string>(initialCode);
  const [activeTab, setActiveTab] = useState<'code' | 'testcase'>('code');
  const [errors, setErrors] = useState<number>(0);
  const [warnings, setWarnings] = useState<number>(0);
  const monaco = useMonaco();
  
  console.log('🔵 Current state:', { selectedLanguage, languagesCount: languages.length });

  // Log khi component mount
  useEffect(() => {
    console.log('🚀 ProblemCodeEditor mounted:', {
      defaultLanguage,
      selectedLanguage,
      languagesCount: languages.length,
      languages: languages.map(l => ({ id: l.id, name: l.name, code: l.code }))
    });
  }, []);

  // Map backend language code to Monaco Editor language ID
  const getMonacoLanguage = (code: string): string => {
    const languageMap: Record<string, string> = {
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
      'python': 'python',
      'python3': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'csharp': 'csharp',
      'cs': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'sql': 'sql',
    };
    
    return languageMap[code.toLowerCase()] || code.toLowerCase();
  };

  // Cấu hình Monaco Editor để bật diagnostics cho C++ và Python
  useEffect(() => {
    if (!monaco || !code) return;
    
    const monacoLang = getMonacoLanguage(selectedLanguage);
    console.log('🔍 Debug validation:', {
      selectedLanguage,
      monacoLang,
      codeLength: code.length,
      codePreview: code.substring(0, 50)
    });
    
    const models = monaco.editor.getModels();
    const model = models.find((m: any) => m.getValue() === code) || models[0];
    
    if (!model) {
      console.log('❌ No model found');
      return;
    }
    
    console.log('✅ Model found:', model.getLanguageId());
    
    const lines = code.split('\n');
    const markers: any[] = [];
    
    // Validation cho C++
    if (monacoLang === 'cpp' || monacoLang === 'c') {
      console.log('🔧 Running C++ validation');
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // Bỏ qua dòng trống, comment, preprocessor directives
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
          return;
        }
        
        // Phát hiện thiếu dấu chấm phẩy ở cuối statement
        // Pattern đơn giản hơn: tìm các dòng có thể thiếu ;
        const hasVariableDecl = /^\s*(int|char|float|double|bool|string|auto|const|static|extern|volatile|register)\s+\w+/.test(line);
        const hasReturn = /^\s*return\s+/.test(line);
        const hasCout = /^\s*cout\s*<</.test(line);
        const hasPrintf = /^\s*printf\s*\(/.test(line);
        
        const needsSemicolon = hasVariableDecl || hasReturn || hasCout || hasPrintf;
        
        if (needsSemicolon && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}')) {
          console.log(`⚠️ Found error at line ${lineNumber}:`, trimmedLine);
          markers.push({
            severity: 8, // Error severity
            startLineNumber: lineNumber,
            startColumn: Math.max(1, line.length),
            endLineNumber: lineNumber,
            endColumn: line.length + 1,
            message: "Expected ';' at end of statement",
          });
        }
      });
    }
    
    // Validation cho Python - Monaco Editor có sẵn Python diagnostics tốt hơn
    // Nhưng vẫn thêm một số validation cơ bản
    if (monacoLang === 'python') {
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // Bỏ qua dòng trống, comment
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return;
        }
        
        // Phát hiện lỗi indentation cơ bản (Monaco sẽ tự phát hiện)
        // Phát hiện thiếu dấu hai chấm sau if/for/while/def/class
        const needsColonPattern = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\s+.*[^:]$/;
        if (needsColonPattern.test(line) && !trimmedLine.endsWith(':')) {
          markers.push({
            severity: 8,
            startLineNumber: lineNumber,
            startColumn: line.length + 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1,
            message: "Expected ':' at end of statement",
          });
        }
      });
    }
    
    // Set markers vào model
    console.log(`📝 Setting ${markers.length} markers`);
    monaco.editor.setModelMarkers(model, 'custom-validator', markers);
  }, [monaco, code, selectedLanguage]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    console.log('🔄 Language changed:', {
      old: selectedLanguage,
      new: newLanguage,
      monacoLang: getMonacoLanguage(newLanguage),
      event: e
    });
    setSelectedLanguage(newLanguage);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    
    // Trigger validation lại khi code thay đổi
    if (monaco && newCode) {
      setTimeout(() => {
        const models = monaco.editor.getModels();
        const model = models.find((m: any) => m.getValue() === newCode) || models[0];
        if (model) {
          const monacoLang = getMonacoLanguage(selectedLanguage);
          const lines = newCode.split('\n');
          const markers: any[] = [];
          
          // Validation cho C++
          if (monacoLang === 'cpp' || monacoLang === 'c') {
            lines.forEach((line, index) => {
              const lineNumber = index + 1;
              const trimmedLine = line.trim();
              
              if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
                return;
              }
              
              const hasVariableDecl = /^\s*(int|char|float|double|bool|string|auto|const|static|extern|volatile|register)\s+\w+/.test(line);
              const hasReturn = /^\s*return\s+/.test(line);
              const hasCout = /^\s*cout\s*<</.test(line);
              const hasPrintf = /^\s*printf\s*\(/.test(line);
              
              const needsSemicolon = hasVariableDecl || hasReturn || hasCout || hasPrintf;
              
              if (needsSemicolon && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}')) {
                markers.push({
                  severity: 8,
                  startLineNumber: lineNumber,
                  startColumn: Math.max(1, line.length),
                  endLineNumber: lineNumber,
                  endColumn: line.length + 1,
                  message: "Expected ';' at end of statement",
                });
              }
            });
          }
          
          // Validation cho Python
          if (monacoLang === 'python') {
            lines.forEach((line, index) => {
              const lineNumber = index + 1;
              const trimmedLine = line.trim();
              
              if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
              }
              
              const needsColonPattern = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\s+.*[^:]$/;
              if (needsColonPattern.test(line) && !trimmedLine.endsWith(':')) {
                markers.push({
                  severity: 8,
                  startLineNumber: lineNumber,
                  startColumn: Math.max(1, line.length),
                  endLineNumber: lineNumber,
                  endColumn: line.length + 1,
                  message: "Expected ':' at end of statement",
                });
              }
            });
          }
          
          monaco.editor.setModelMarkers(model, 'custom-validator', markers);
        }
      }, 100);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(code, selectedLanguage);
    }
  };

  const handleTest = () => {
    if (onTest) {
      onTest(code, selectedLanguage);
    }
  };


  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit
          </button>
          <button
            onClick={handleTest}
            className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Test
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <FiMaximize2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <FiSettings className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <FiBell className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'code'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setActiveTab('testcase')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'testcase'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Testcase
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' ? (
          <div className="h-full flex flex-col">
            {/* Language Selector */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('📝 ===== SELECT ONCHANGE =====');
                    console.log('📝 Old value:', selectedLanguage);
                    console.log('📝 New value:', newValue);
                    console.log('📝 Event:', e);
                    console.log('📝 All languages:', languages);
                    handleLanguageChange(e);
                    console.log('📝 ===== END ONCHANGE =====');
                  }}
                  onFocus={() => {
                    console.log('👁️ Select focused');
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.length === 0 ? (
                    <option value="">No languages available</option>
                  ) : (
                    languages.map((lang) => {
                      const langCode = lang.code || lang.name.toLowerCase();
                      console.log('🌐 Rendering option:', { id: lang.id, name: lang.name, code: lang.code, langCode });
                      return (
                        <option key={lang.id} value={langCode}>
                          {lang.name} ({langCode})
                        </option>
                      );
                    })
                  )}
                </select>
                <button className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Auto
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={getMonacoLanguage(selectedLanguage)}
                value={code}
                onChange={handleCodeChange}
                theme="vs-light"
                onMount={(editor, monacoInstance) => {
                  // Khi editor mount, set up validation
                  console.log('🎯 Editor mounted, language:', getMonacoLanguage(selectedLanguage));
                  
                  // Trigger validation ngay lập tức
                  const model = editor.getModel();
                  if (model) {
                    // Run custom validation
                    setTimeout(() => {
                      const lines = code.split('\n');
                      const markers: any[] = [];
                      const monacoLang = getMonacoLanguage(selectedLanguage);
                      
                      // Validation cho C++
                      if (monacoLang === 'cpp' || monacoLang === 'c') {
                        lines.forEach((line, index) => {
                          const lineNumber = index + 1;
                          const trimmedLine = line.trim();
                          
                          if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
                            return;
                          }
                          
                          const hasVariableDecl = /^\s*(int|char|float|double|bool|string|auto|const|static|extern|volatile|register)\s+\w+/.test(line);
                          const hasReturn = /^\s*return\s+/.test(line);
                          const hasCout = /^\s*cout\s*<</.test(line);
                          const hasPrintf = /^\s*printf\s*\(/.test(line);
                          
                          const needsSemicolon = hasVariableDecl || hasReturn || hasCout || hasPrintf;
                          
                          if (needsSemicolon && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}')) {
                            markers.push({
                              severity: 8,
                              startLineNumber: lineNumber,
                              startColumn: Math.max(1, line.length),
                              endLineNumber: lineNumber,
                              endColumn: line.length + 1,
                              message: "Expected ';' at end of statement",
                            });
                          }
                        });
                      }
                      
                      // Validation cho Python
                      if (monacoLang === 'python') {
                        lines.forEach((line, index) => {
                          const lineNumber = index + 1;
                          const trimmedLine = line.trim();
                          
                          if (!trimmedLine || trimmedLine.startsWith('#')) {
                            return;
                          }
                          
                          const needsColonPattern = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\s+.*[^:]$/;
                          if (needsColonPattern.test(line) && !trimmedLine.endsWith(':')) {
                            markers.push({
                              severity: 8,
                              startLineNumber: lineNumber,
                              startColumn: Math.max(1, line.length),
                              endLineNumber: lineNumber,
                              endColumn: line.length + 1,
                              message: "Expected ':' at end of statement",
                            });
                          }
                        });
                      }
                      
                      console.log(`📝 Setting ${markers.length} markers for ${monacoLang}`);
                      monacoInstance.editor.setModelMarkers(model, 'custom-validator', markers);
                    }, 100);
                  }
                }}
                onValidate={(markers) => {
                  const errorCount = markers.filter(m => m.severity === 8).length; // 8 = Error
                  const warningCount = markers.filter(m => m.severity === 4).length; // 4 = Warning
                  setErrors(errorCount);
                  setWarnings(warningCount);
                  
                  // Log để debug
                  if (markers.length > 0) {
                    console.log('✅ Monaco markers:', markers);
                  }
                }}
                beforeMount={(monaco) => {
                  // Cấu hình C++ language để có diagnostics tốt hơn
                  monaco.languages.setLanguageConfiguration('cpp', {
                    comments: {
                      lineComment: '//',
                      blockComment: ['/*', '*/'],
                    },
                    brackets: [
                      ['{', '}'],
                      ['[', ']'],
                      ['(', ')'],
                    ],
                    autoClosingPairs: [
                      { open: '{', close: '}' },
                      { open: '[', close: ']' },
                      { open: '(', close: ')' },
                      { open: '"', close: '"' },
                      { open: "'", close: "'" },
                    ],
                    surroundingPairs: [
                      { open: '{', close: '}' },
                      { open: '[', close: ']' },
                      { open: '(', close: ')' },
                      { open: '"', close: '"' },
                      { open: "'", close: "'" },
                    ],
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  cursorStyle: 'line',
                  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                  // Bật syntax checking và error highlighting
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: 'on',
                  tabCompletion: 'on',
                  wordBasedSuggestions: 'allDocuments',
                  // Bật semantic highlighting và diagnostics
                  semanticHighlighting: {
                    enabled: true,
                  },
                  // Hiển thị lỗi real-time - QUAN TRỌNG
                  glyphMargin: true,
                  folding: true,
                  foldingStrategy: 'auto',
                  showFoldingControls: 'always',
                  unfoldOnClickAfterEndOfLine: false,
                  // Bật error squiggles - QUAN TRỌNG để hiển thị lỗi
                  renderValidationDecorations: 'on',
                  // Bật diagnostics
                  'diagnostics.enabled': true,
                  // Bật hover để xem chi tiết lỗi
                  hover: {
                    enabled: true,
                    delay: 100,
                  },
                  // Bật lightbulb suggestions
                  lightbulb: {
                    enabled: true,
                  },
                  // Bật parameter hints
                  parameterHints: {
                    enabled: true,
                  },
                  // Bật bracket matching
                  matchBrackets: 'always',
                }}
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Saved</span>
                {errors > 0 && (
                  <span className="text-red-600 font-medium">
                    {errors} {errors === 1 ? 'error' : 'errors'}
                  </span>
                )}
                {warnings > 0 && (
                  <span className="text-yellow-600 font-medium">
                    {warnings} {warnings === 1 ? 'warning' : 'warnings'}
                  </span>
                )}
                {errors === 0 && warnings === 0 && (
                  <span className="text-green-600 font-medium">No issues</span>
                )}
              </div>
              <span>Ln 1, Col 1</span>
            </div>
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                Case 1
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50">
                Case 2
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50">
                Case 3
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50">
                +
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Enter test case input..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Output</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Enter expected output..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemCodeEditor;

