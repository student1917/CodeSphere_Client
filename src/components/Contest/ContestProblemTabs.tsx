import { useState } from 'react';
import type { ContestProblemResponse } from '@/types/contest.types';
import { useNavigate } from 'react-router-dom';

interface ContestProblemTabsProps {
  problems: ContestProblemResponse[];
  contestId: number;
  activeProblemId?: number;
}

const ContestProblemTabs = ({ problems, contestId, activeProblemId }: ContestProblemTabsProps) => {
  const navigate = useNavigate();

  const handleProblemClick = (problemId: number) => {
    // Navigate to problem detail page with contest context
    navigate(`/problems/${problemId}?contestId=${contestId}`);
  };

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
      {problems.map((problem) => (
        <button
          key={problem.problemId}
          onClick={() => handleProblemClick(problem.problemId)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeProblemId === problem.problemId
              ? 'bg-blue-600 text-white'
              : problem.isSolved
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {problem.order}
          {problem.isSolved && ' ✓'}
        </button>
      ))}
    </div>
  );
};

export default ContestProblemTabs;

