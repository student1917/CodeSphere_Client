import { FiPlay, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import type { RunCodeResponse } from '@/apis/submission.api';

interface ResultPanelProps {
  runResults: RunCodeResponse | null;
}

const ResultPanel = ({ runResults }: ResultPanelProps) => {
  if (!runResults) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FiPlay className="w-16 h-16 mb-4 text-gray-400" />
        <p className="text-lg font-medium">Chưa có kết quả</p>
        <p className="text-sm mt-2">Nhấn "Run" hoặc "Submit" để chạy code và xem kết quả</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto bg-gray-50">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Kết quả</h3>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            runResults.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {runResults.success ? (
              <FiCheckCircle className="w-5 h-5" />
            ) : (
              <FiXCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {runResults.totalPassed}/{runResults.totalTests} passed
            </span>
          </div>
        </div>
        
        {/* Summary Message */}
        {runResults.message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            runResults.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="font-medium">{runResults.message}</p>
          </div>
        )}
        
        {/* Compile Error */}
        {(runResults.compileError || runResults.fullCompileError) && (
          <div className="mb-6 p-4 rounded-lg border-2 border-red-300 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <FiXCircle className="w-5 h-5 text-red-600" />
              <h4 className="text-base font-semibold text-red-900">Compilation Error</h4>
            </div>
            <div className="space-y-2">
              {runResults.fullCompileError && (
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">Full Error:</p>
                  <pre className="p-3 bg-white rounded border border-red-200 text-sm font-mono text-red-900 overflow-x-auto whitespace-pre-wrap">
                    {runResults.fullCompileError}
                  </pre>
                </div>
              )}
              {runResults.compileError && !runResults.fullCompileError && (
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                  <pre className="p-3 bg-white rounded border border-red-200 text-sm font-mono text-red-900 overflow-x-auto whitespace-pre-wrap">
                    {runResults.compileError}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Test Results Details */}
        {runResults.testResults && runResults.testResults.length > 0 ? (
          <div className="space-y-4">
            {runResults.testResults.map((result, index) => (
              <div
                key={index}
                className={`p-5 rounded-lg border-2 ${
                  result.isPassed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {result.isPassed ? (
                    <FiCheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <FiXCircle className="w-6 h-6 text-red-600" />
                  )}
                  <span className="text-base font-semibold text-gray-900">
                    Test Case {index + 1}
                    {result.testCaseId === null && ' (Custom)'}
                  </span>
                  <span className="text-sm text-gray-600 ml-auto">
                    {result.runtime} • {result.memory}
                  </span>
                </div>
                
                {!result.isPassed && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Input:</span>
                      <pre className="mt-2 p-3 bg-white rounded-lg border border-gray-300 text-sm font-mono overflow-x-auto">
                        {result.input || '(empty)'}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-semibold text-gray-700">Expected:</span>
                        <pre className="mt-2 p-3 bg-white rounded-lg border border-gray-300 text-sm font-mono overflow-x-auto">
                          {result.expectedOutput || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Got:</span>
                        <pre className="mt-2 p-3 bg-white rounded-lg border border-gray-300 text-sm font-mono overflow-x-auto">
                          {result.actualOutput || '(empty)'}
                        </pre>
                      </div>
                    </div>
                    {result.errorMessage && (
                      <div>
                        <span className="font-semibold text-red-700">Error:</span>
                        <pre className="mt-2 p-3 bg-red-100 rounded-lg border border-red-300 text-sm font-mono text-red-800 overflow-x-auto">
                          {result.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Không có chi tiết test cases</p>
            <p className="text-xs mt-2">Tổng kết: {runResults.totalPassed}/{runResults.totalTests} test cases passed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPanel;

