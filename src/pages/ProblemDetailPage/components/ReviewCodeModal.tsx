import { FiX, FiCheckCircle } from 'react-icons/fi';

interface ReviewCodeModalProps {
  isOpen: boolean;
  reviewResult: string | null;
  onClose: () => void;
}

const ReviewCodeModal = ({ isOpen, reviewResult, onClose }: ReviewCodeModalProps) => {
  if (!isOpen || !reviewResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Đánh giá Code</h2>
              <p className="text-sm text-gray-600 mt-0.5">Phân tích chi tiết về code của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
          <div className="space-y-4">
            {reviewResult.split(/\n(?=\*\*|##|###|1\.|2\.|3\.|4\.|5\.|6\.)/).map((section, index) => {
              const isHeader = section.match(/^\*\*(.+?)\*\*/) || section.match(/^##\s*(.+)/) || section.match(/^###\s*(.+)/);
              const isNumberedSection = section.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
              
              if (isNumberedSection) {
                const [, number, title] = isNumberedSection;
                const content = section.replace(/^\d+\.\s*\*\*.+?\*\*\s*/, '').trim();
                return (
                  <div key={index} className="bg-white rounded-lg border-l-4 border-blue-500 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {number}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCodeModal;

