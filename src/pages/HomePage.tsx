import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '@/components/Layout/Container';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import CodeEditorDisplay from '@/components/CodeEditor/CodeEditorDisplay';
import { ROUTES } from '@/utils/constants';
import { problemApi } from '@/apis/problem.api';
import type { ProblemResponse } from '@/types/problem.types';
import { FiCode, FiAward, FiUsers, FiTrendingUp, FiZap } from 'react-icons/fi';

const HomePage = () => {
  const [featuredProblems, setFeaturedProblems] = useState<ProblemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProblems = async () => {
      try {
        setIsLoading(true);
        const response = await problemApi.getProblems({
          page: 0,
          size: 3,
          sortBy: 'createdAt',
          sortDir: 'DESC',
        });
        setFeaturedProblems(response.content);
      } catch (error) {
        console.error('Error fetching featured problems:', error);
        setFeaturedProblems([
          { id: 1, title: 'Two Sum', level: 'EASY' } as ProblemResponse,
          { id: 2, title: 'Reverse Linked List', level: 'MEDIUM' } as ProblemResponse,
          { id: 3, title: 'Binary Tree Maximum Path Sum', level: 'HARD' } as ProblemResponse,
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProblems();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 backdrop-blur-sm rounded-full text-blue-700 text-sm font-medium mb-6">
                <FiZap className="w-4 h-4" />
                <span>Welcome to CodeSphere</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                Master Coding Skills Through Practice
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                CodeSphere is a comprehensive programming practice platform that helps you enhance your coding skills, 
                participate in programming contests, and connect with developers worldwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={ROUTES.PROBLEMS}>
                  <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                    Start Practicing
                  </Button>
                </Link>
                <Link to={ROUTES.LEADERBOARD}>
                  <Button variant="outline" size="lg" className="border-2 hover:bg-gray-50 transition-all">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Code Editor */}
            <div className="relative z-10">
              <CodeEditorDisplay />
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Problems Section */}
      <section className="relative py-20 bg-white/60 backdrop-blur-md">
        <Container>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Featured Problems
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover popular problems solved by many developers
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProblems.map((problem, index) => (
                <Link
                  key={problem.id}
                  to={`${ROUTES.PROBLEMS}/${problem.id}`}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-2 hover:border-blue-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {problem.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        problem.level === 'EASY'
                          ? 'bg-green-100 text-green-800'
                          : problem.level === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {problem.level}
                    </span>
                  </div>
                  {problem.authorName && (
                    <p className="text-sm text-gray-600">
                      Author: <span className="font-medium">{problem.authorName}</span>
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to={ROUTES.PROBLEMS}>
              <Button variant="outline" size="lg" className="border-2 hover:bg-gray-50">
                View All Problems
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <FiCode className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Thousands of Problems</h3>
              <p className="text-gray-600 leading-relaxed">
                Practice with problems ranging from basic to advanced levels
              </p>
            </div>
            <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <FiAward className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Regular Contests</h3>
              <p className="text-gray-600 leading-relaxed">
                Participate in programming contests to enhance your skills
              </p>
            </div>
            <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <FiUsers className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Active Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Discuss and learn from the programming community
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
