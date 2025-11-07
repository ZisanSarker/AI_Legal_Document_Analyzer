"use client";

import { Loader2, FileSearch, Brain, Shield, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoaderOverlay() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: FileSearch, text: "Reading document content", delay: 0 },
    { icon: Brain, text: "Analyzing with AI", delay: 2000 },
    { icon: Shield, text: "Detecting risks and anomalies", delay: 4000 },
    { icon: CheckCircle2, text: "Generating summary", delay: 6000 },
  ];

  useEffect(() => {
    const timers = steps.map((step, index) => 
      setTimeout(() => setCurrentStep(index), step.delay)
    );
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md mx-4 text-center space-y-8 border border-gray-100">
        {/* Animated Main Icon */}
        <div className="relative w-28 h-28 mx-auto">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-t-blue-500 border-r-indigo-500 border-b-purple-500 border-l-pink-500 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 border-4 border-blue-300 rounded-full animate-pulse opacity-40"></div>
          
          {/* Inner circle with gradient */}
          <div className="absolute inset-4 bg-linear-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
            <FileSearch className="w-12 h-12 text-white animate-pulse" />
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
        </div>

        {/* Main Title */}
        <div className="space-y-3">
          <h3 className="text-3xl font-bold text-gray-900">
            Analyzing Document
          </h3>
          <p className="text-base text-gray-600">
            Our AI is processing your document with advanced legal analysis
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 text-left">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div 
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-500 ${
                  isActive 
                    ? 'bg-blue-50 border border-blue-200 scale-105' 
                    : isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-blue-500 animate-pulse' 
                    : isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className={`w-5 h-5 text-white ${isActive ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isActive 
                    ? 'text-blue-700' 
                    : isCompleted 
                    ? 'text-green-700' 
                    : 'text-gray-500'
                }`}>
                  {step.text}
                </span>
                {isActive && (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin ml-auto" />
                )}
              </div>
            );
          })}
        </div>

        {/* Loading Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ 
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-2 pt-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Time Estimate */}
        <p className="text-sm text-gray-500 italic">
          This usually takes 5-10 seconds
        </p>
      </div>
    </div>
  );
}
