import { useNavigate } from 'react-router-dom';
import {
  FiX,
  FiSearch,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiLoader,
  FiCheckCircle,
} from 'react-icons/fi';
import { ROUTES } from '@/utils/constants';
import type { ProblemResponse } from '@/types/problem.types';

interface ProblemListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  problemList: ProblemResponse[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalSolved: number;
  currentProblemId?: string;
}

const ProblemListSidebar = ({
  isOpen,
  onClose,
  problemList,
  isLoading,
  searchQuery,
  onSearchChange,
  totalSolved,
  currentProblemId,
}: ProblemListSidebarProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Sidebar - Bên trái */}
      <div className="w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Problem List</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="Sort">
              <div className="flex flex-col">
                <FiArrowUp className="w-3 h-3 -mb-0.5" />
                <FiArrowDown className="w-3 h-3" />
              </div>
            </button>
            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="Filter">
              <FiFilter className="w-4 h-4" />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {totalSolved}/{problemList.length} Solved
              </span>
            </div>
          </div>
        </div>

        {/* Problem List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : problemList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Không có problems nào
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {problemList
                .filter((p) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    p.title.toLowerCase().includes(query) ||
                    p.code.toLowerCase().includes(query)
                  );
                })
                .map((p) => {
                  const isCurrent = p.id === Number(currentProblemId);
                  const isSolved = p.status === 'COMPLETED';
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigate(`${ROUTES.PROBLEMS}/${p.id}`);
                        onClose();
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        isCurrent ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon placeholder để giữ alignment */}
                        <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                          {isSolved && (
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <span className={`text-sm font-medium flex-1 ${isSolved ? 'text-gray-900' : 'text-gray-700'}`}>
                          {p.title}
                        </span>
                        <span className={`text-xs font-medium flex-shrink-0 ${
                          p.level === 'EASY' ? 'text-green-600' :
                          p.level === 'MEDIUM' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {p.level === 'EASY' ? 'Easy' :
                           p.level === 'MEDIUM' ? 'Med.' :
                           'Hard'}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      {/* Overlay - Bên phải sidebar */}
      <div
        className="flex-1 bg-black bg-opacity-50"
        onClick={onClose}
      />
    </div>
  );
};

export default ProblemListSidebar;

