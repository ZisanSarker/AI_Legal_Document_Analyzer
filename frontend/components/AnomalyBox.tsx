"use client";

import { AlertCircle, XCircle, AlertTriangle } from "lucide-react";

interface AnomalyBoxProps {
  anomalies: {
    anomalies: string[];
    completeness: number;
    note: string;
  };
}

export default function AnomalyBox({ anomalies }: AnomalyBoxProps) {
  if (!anomalies?.anomalies || anomalies.anomalies.length === 0) return null;
  
  const missingClauses = anomalies.anomalies;

  return (
    <div className="relative group">
      {/* Animated gradient border effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-rose-600 via-red-600 to-rose-700 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-all duration-300"></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-linear-to-br from-rose-600 via-red-600 to-rose-700 p-8">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Missing Clauses</h2>
                <p className="text-rose-100 text-sm">
                  {missingClauses.length} {missingClauses.length === 1 ? 'clause' : 'clauses'} not detected in document
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
              <span className="text-white text-sm font-semibold">Alert</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="space-y-4">
            {missingClauses.map((anomaly, idx) => (
              <div 
                key={idx}
                className="group/item relative bg-linear-to-br from-rose-50 to-red-50 rounded-2xl p-5 border-2 border-rose-200 hover:border-rose-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className="shrink-0 mt-1 p-2 bg-white rounded-xl shadow-sm">
                    <XCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold text-base">
                      {anomaly}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Standard clause typically found in similar documents
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Info Footer */}
          <div className="mt-8 p-6 bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
            <div className="flex items-start space-x-4">
              <div className="shrink-0 p-2 bg-white rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-base text-amber-900 font-bold mb-2">
                  ⚠️ Review Recommended
                </p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  These clauses are typically expected in similar documents. We recommend reviewing this document with legal counsel to ensure completeness and compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
