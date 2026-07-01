import { useState, useEffect } from 'react';
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

interface ReviewPanelProps {
  reviewResult: string | null;
  isReviewing: boolean;
  code: string;
  problemId: number;
  language: string;
  onRefactorSuggestions: (suggestions: string[]) => Promise<void>;
  isRefactoring: boolean;
}

const ReviewPanel = ({ 
  reviewResult, 
  isReviewing, 
  code,
  problemId,
  language,
  onRefactorSuggestions,
  isRefactoring
}: ReviewPanelProps) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [suggestionSections, setSuggestionSections] = useState<Array<{index: number, title: string, content: string}>>([]);

  // Parse suggestions từ review result
  useEffect(() => {
    if (!reviewResult) {
      setSuggestionSections([]);
      setSelectedSuggestions(new Set());
      return;
    }

    const sections: Array<{index: number, title: string, content: string}> = [];
    // Split by numbered sections (1. **Title**, 2. **Title**, etc.)
    // Also handle cases where there might be newlines before the number
    const parts = reviewResult.split(/\n(?=\d+\.\s*\*\*)/);
    
    parts.forEach((section, idx) => {
      // Match pattern: "1. **Title**" or "1.**Title**" (with or without space)
      const isNumberedSection = section.match(/^(\d+)\.\s*\*\*(.+?)\*\*/m);
      if (isNumberedSection) {
        const [, number, title] = isNumberedSection;
        // Remove the numbered header and get the rest as content
        const content = section.replace(/^\d+\.\s*\*\*.+?\*\*\s*/, '').trim();
        if (content) { // Only add if there's content
          sections.push({
            index: idx,
            title: `${number}. ${title}`,
            content: content
          });
        }
      }
    });

    setSuggestionSections(sections);
    // Reset selections when review result changes
    setSelectedSuggestions(new Set());
  }, [reviewResult]);
  if (isReviewing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-medium">Reviewing code...</p>
        <p className="text-sm mt-2 text-gray-400">Please wait a moment</p>
      </div>
    );
  }

  if (!reviewResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FiCheckCircle className="w-16 h-16 mb-4 text-gray-400" />
        <p className="text-lg font-medium">No review yet</p>
        <p className="text-sm mt-2">Click "Review Code" to see feedback about your code</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Code Review</h2>
              <p className="text-sm text-gray-600 mt-0.5">Detailed analysis of your code</p>
            </div>
          </div>
          {selectedSuggestions.size > 0 && (
            <button
              onClick={async () => {
                const suggestions = Array.from(selectedSuggestions)
                  .map(idx => suggestionSections[idx])
                  .map(s => `${s.title}\n${s.content}`)
                  .join('\n\n---\n\n');
                await onRefactorSuggestions([suggestions]);
                setSelectedSuggestions(new Set());
              }}
              disabled={isRefactoring}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`w-4 h-4 ${isRefactoring ? 'animate-spin' : ''}`} />
              {isRefactoring ? 'Refactoring...' : `Refactor ${selectedSuggestions.size} selected items`}
            </button>
          )}
        </div>
        {selectedSuggestions.size > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              💡 <strong>{selectedSuggestions.size}</strong> suggestions selected for refactoring. 
              Click the "Refactor" button to improve code based on selected suggestions (only 1 API call).
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {reviewResult.split(/\n(?=\*\*|##|###|1\.|2\.|3\.|4\.|5\.|6\.)/).map((section, index) => {
          const isHeader = section.match(/^\*\*(.+?)\*\*/) || section.match(/^##\s*(.+)/) || section.match(/^###\s*(.+)/);
          const isNumberedSection = section.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
          
          if (isNumberedSection) {
            const [, number, title] = isNumberedSection;
            const content = section.replace(/^\d+\.\s*\*\*.+?\*\*\s*/, '').trim();
            // Tìm suggestion section tương ứng bằng cách so sánh index trong parts array
            const sectionIndex = suggestionSections.findIndex(s => s.index === index);
            const isSelected = sectionIndex !== -1 && selectedSuggestions.has(sectionIndex);
            
            return (
              <div key={index} className={`bg-white rounded-lg border-l-4 p-4 shadow-sm transition-all ${
                isSelected ? 'border-purple-500 bg-purple-50' : 'border-blue-500'
              }`}>
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isSelected ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  </div>
                  {sectionIndex !== -1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newSelected = new Set(selectedSuggestions);
                          if (isSelected) {
                            newSelected.delete(sectionIndex);
                          } else {
                            newSelected.add(sectionIndex);
                          }
                          setSelectedSuggestions(newSelected);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="ml-11 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            );
          } else if (isHeader) {
            const title = isHeader[1] || isHeader[2] || isHeader[3];
            const content = section.replace(/^\*\*(.+?)\*\*\s*/, '').replace(/^##\s*(.+)/, '').replace(/^###\s*(.+)/, '').trim();
            const isMainHeader = section.startsWith('##');
            return (
              <div key={index} className={isMainHeader ? "bg-white rounded-lg border-2 border-blue-300 p-5 shadow-md" : "bg-white rounded-lg border-l-4 border-indigo-500 p-4 shadow-sm"}>
                <h3 className={`${isMainHeader ? 'text-xl' : 'text-lg'} font-bold text-gray-900 mb-3`}>
                  {title}
                </h3>
                {content && (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </div>
                )}
              </div>
            );
          } else if (section.trim()) {
            return (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.trim()}
                </div>
              </div>
            );
          }
          return null;
        })}
        
        {!reviewResult.match(/\*\*|##|###|\d+\./) && (
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {reviewResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPanel;

