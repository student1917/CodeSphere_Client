import { FiPlus, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import type { TestCaseResponse } from '@/apis/problem.api';
import type { CustomTestCase, RunCodeResponse } from '@/apis/submission.api';

interface TestCasePanelProps {
  sampleTestCases: TestCaseResponse[];
  customTestCases: CustomTestCase[];
  selectedTestCaseIndex: number;
  onSelectTestCase: (index: number) => void;
  onAddCustomTestCase: () => void;
  onDeleteCustomTestCase: (index: number) => void;
  onUpdateCustomTestCase: (index: number, testCase: CustomTestCase) => void;
  runResults: RunCodeResponse | null;
}

const TestCasePanel = ({
  sampleTestCases,
  customTestCases,
  selectedTestCaseIndex,
  onSelectTestCase,
  onAddCustomTestCase,
  onDeleteCustomTestCase,
  onUpdateCustomTestCase,
  runResults,
}: TestCasePanelProps) => {
  const isSample = selectedTestCaseIndex < sampleTestCases.length;
  const customIndex = isSample ? -1 : selectedTestCaseIndex - sampleTestCases.length;
  const currentCase = isSample 
    ? sampleTestCases[selectedTestCaseIndex]
    : customTestCases[customIndex] || { input: '', expectedOutput: '' };

  return (
    <div className="p-4 h-full overflow-y-auto bg-gray-50">
      {/* Test Case Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {sampleTestCases.length > 0 ? (
          sampleTestCases.map((testCase, index) => (
            <button
              key={`sample-${testCase.id}`}
              onClick={() => onSelectTestCase(index)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                selectedTestCaseIndex === index
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              Case {index + 1}
            </button>
          ))
        ) : (
          <div className="text-sm text-gray-500 italic">Chưa có sample testcases</div>
        )}
        
        {customTestCases.map((_, index) => (
          <button
            key={`custom-${index}`}
            onClick={() => onSelectTestCase(sampleTestCases.length + index)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
              selectedTestCaseIndex === sampleTestCases.length + index
                ? 'bg-green-500 text-white border-green-500 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
            }`}
          >
            Case {sampleTestCases.length + index + 1}
          </button>
        ))}
        
        <button
          onClick={onAddCustomTestCase}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <FiPlus className="w-4 h-4" />
          <span>Thêm</span>
        </button>
      </div>

      {/* Test Case Content */}
      <div className="space-y-4">
        {isSample ? (
          <>
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Sample Testcase
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-white text-gray-900 shadow-sm">
                <pre className="whitespace-pre-wrap">{currentCase.input || 'N/A'}</pre>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Output
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-white text-gray-900 shadow-sm">
                <pre className="whitespace-pre-wrap">{currentCase.expectedOutput || 'N/A'}</pre>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Custom Testcase {customIndex + 1}
                </span>
              </div>
              <button
                onClick={() => onDeleteCustomTestCase(customIndex)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Xóa testcase này"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input
              </label>
              <textarea
                value={currentCase.input}
                onChange={(e) => onUpdateCustomTestCase(customIndex, { ...currentCase, input: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Enter test case input..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Output (optional)
              </label>
              <textarea
                value={currentCase.expectedOutput || ''}
                onChange={(e) => onUpdateCustomTestCase(customIndex, { ...currentCase, expectedOutput: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Enter expected output (optional)..."
              />
            </div>
          </>
        )}
        
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <p>💡 Tip: Run sẽ chạy tất cả sample testcases ({sampleTestCases.length}) và {customTestCases.filter(tc => tc.input.trim()).length} custom testcase(s) bạn đã tạo.</p>
        </div>
      </div>

      {/* Run Results */}
      {runResults && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Kết quả</h3>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
              runResults.success 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {runResults.success ? (
                <FiCheckCircle className="w-4 h-4" />
              ) : (
                <FiXCircle className="w-4 h-4" />
              )}
              {runResults.totalPassed}/{runResults.totalTests} passed
            </div>
          </div>
          
          <div className="space-y-3">
            {runResults.testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.isPassed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {result.isPassed ? (
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <FiXCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    Test Case {index + 1}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {result.runtime} • {result.memory}
                  </span>
                </div>
                
                {!result.isPassed && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Input:</span>
                      <pre className="mt-1 p-2 bg-white rounded border border-gray-200 text-xs font-mono overflow-x-auto">
                        {result.input}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-gray-700">Expected:</span>
                        <pre className="mt-1 p-2 bg-white rounded border border-gray-200 text-xs font-mono overflow-x-auto">
                          {result.expectedOutput}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Got:</span>
                        <pre className="mt-1 p-2 bg-white rounded border border-gray-200 text-xs font-mono overflow-x-auto">
                          {result.actualOutput || '(empty)'}
                        </pre>
                      </div>
                    </div>
                    {result.errorMessage && (
                      <div>
                        <span className="font-medium text-red-700">Error:</span>
                        <pre className="mt-1 p-2 bg-red-100 rounded border border-red-200 text-xs font-mono text-red-800 overflow-x-auto">
                          {result.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCasePanel;

