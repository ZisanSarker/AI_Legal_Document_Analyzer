"use client";

import { CheckCircle2, TrendingUp, Award } from "lucide-react";

interface ClauseListProps {
  clauses: { label: string; confidence: number }[];
}

export default function ClauseList({ clauses }: ClauseListProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (confidence >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 70) return "bg-linear-to-r from-emerald-500 to-green-600";
    if (confidence >= 50) return "bg-linear-to-r from-amber-500 to-orange-600";
    return "bg-linear-to-r from-rose-500 to-red-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return { text: 'High Confidence', emoji: '🎯' };
    if (confidence >= 50) return { text: 'Medium Confidence', emoji: '⚡' };
    return { text: 'Low Confidence', emoji: '⚠️' };
  };

  return (
    <div className="relative group">
      {/* Animated gradient border effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-all duration-300"></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-linear-to-br from-indigo-600 via-purple-600 to-pink-700 p-8">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Detected Clauses</h2>
                <p className="text-purple-100 text-sm flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{clauses.length} clauses identified with AI confidence scores</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Clause List */}
        <div className="p-8">
          <div className="space-y-5">
            {clauses.map((clause, idx) => {
              const confidenceInfo = getConfidenceLabel(clause.confidence);
              return (
                <div 
                  key={idx} 
                  className="group/item relative bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Clause Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="shrink-0 mt-1">
                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          {clause.label}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{confidenceInfo.emoji}</span>
                          <span>{confidenceInfo.text}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Confidence Badge */}
                    <div className={`shrink-0 ml-4 px-5 py-2.5 rounded-xl font-bold text-base border-2 ${getConfidenceColor(clause.confidence)}`}>
                      {clause.confidence}%
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${getConfidenceBarColor(clause.confidence)} shadow-lg`}
                      style={{ width: `${clause.confidence}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
