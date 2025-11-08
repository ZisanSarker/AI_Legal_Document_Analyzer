"use client";

import { FileText, Sparkles, CheckCircle, Shield } from "lucide-react";

interface SummaryCardProps {
  summary: string;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div className="relative group">
      {/* Animated gradient border effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-all duration-300"></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with enhanced gradient */}
        <div className="relative bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 p-8">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Document Summary</h2>
                <p className="text-blue-100 text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-generated overview</span>
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
              <span className="text-white text-sm font-semibold">Analysis</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {summary}
            </p>
          </div>
          
          {/* Stats Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Analysis Complete</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Verified by AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
