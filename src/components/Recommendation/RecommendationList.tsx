import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { recommendationApi, type RecommendationResponse } from '@/apis/recommendation.api';
import { FiTrendingUp, FiLoader, FiAlertCircle } from 'react-icons/fi';
import Loading from '@/components/Loading';

// Cache key in localStorage
const CACHE_KEY = 'recommendations_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  recommendations: RecommendationResponse[];
  timestamp: number;
  limit: number;
  useOpenAI: boolean;
}

/**
 * Component to display recommendations list with cache
 */
const RecommendationList = ({ limit = 10, useOpenAI = true }: { limit?: number; useOpenAI?: boolean }) => {
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false); // Prevent multiple simultaneous API calls

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Prevent multiple simultaneous API calls
      if (isFetchingRef.current) {
        return;
      }

      try {
        // Check cache first
        const cacheKey = `${CACHE_KEY}_${limit}_${useOpenAI}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const parsed: CacheData = JSON.parse(cachedData);
            const now = Date.now();
            
            // If cache is still valid (within 5 minutes) and same limit, useOpenAI
            if (now - parsed.timestamp < CACHE_DURATION && 
                parsed.limit === limit && 
                parsed.useOpenAI === useOpenAI) {
              console.log('Using recommendations from cache');
              setRecommendations(parsed.recommendations);
              setLoading(false);
              return; // Use cache, no need to call API
            }
          } catch (e) {
            // Cache invalid, remove it
            localStorage.removeItem(cacheKey);
          }
        }

        // No cache or cache expired → call API
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        
        const data = await recommendationApi.getRecommendations(limit, useOpenAI);
        setRecommendations(data);
        
        // Save to cache
        const cacheData: CacheData = {
          recommendations: data,
          timestamp: Date.now(),
          limit,
          useOpenAI
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Unable to load recommendations. Please try again later.');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchRecommendations();
  }, [limit, useOpenAI]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-slate-800">Recommended for You</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-slate-800">Recommended for You</h3>
        </div>
        <div className="flex items-center gap-2 text-amber-600 py-4">
          <FiAlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-slate-800">Recommended for You</h3>
        </div>
        <p className="text-slate-500 text-sm py-4">
          No recommendations yet. Solve more problems to get personalized suggestions!
        </p>
      </div>
    );
  }

  // Function to get color for level
  const getLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'EASY':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'HARD':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Function to format predicted rating
  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiTrendingUp className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-slate-800">
          Recommended for You
          {useOpenAI && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
              AI Enhanced
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <Link
            key={rec.problemId}
            to={`/problems/${rec.problemId}`}
            className="block p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  {rec.level && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${getLevelColor(
                        rec.level
                      )}`}
                    >
                      {rec.level}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    Relevance: {formatRating(rec.predictedRating)}/5.0
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                  {rec.title || `Problem #${rec.problemId}`}
                </h4>
                {rec.explanation && (
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 italic">
                    {rec.explanation}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {formatRating(rec.predictedRating)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {recommendations.length >= limit && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Link
            to="/problems"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View more problems →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecommendationList;

