"use client";

import { Shield, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

interface RiskMeterProps {
  risk: {
    riskScore: number;
    riskLevel: string;
    note: string;
  };
}

export default function RiskMeter({ risk }: RiskMeterProps) {
  let gradient = "from-emerald-500 via-green-500 to-emerald-600";
  let textColor = "text-emerald-700";
  let bgColor = "from-emerald-50 to-green-50";
  let icon = <CheckCircle2 className="w-10 h-10" />;
  let badgeGradient = "from-emerald-500 to-green-600";
  let ringColor = "ring-emerald-500/30";
  
  if (risk.riskLevel === "High Risk") {
    gradient = "from-rose-500 via-red-500 to-rose-600";
    textColor = "text-rose-700";
    bgColor = "from-rose-50 to-red-50";
    icon = <AlertTriangle className="w-10 h-10" />;
    badgeGradient = "from-rose-500 to-red-600";
    ringColor = "ring-rose-500/30";
  } else if (risk.riskLevel === "Medium Risk") {
    gradient = "from-amber-500 via-orange-500 to-amber-600";
    textColor = "text-amber-700";
    bgColor = "from-amber-50 to-orange-50";
    icon = <Shield className="w-10 h-10" />;
    badgeGradient = "from-amber-500 to-orange-600";
    ringColor = "ring-amber-500/30";
  }

  return (
    <div className="relative group">
      {/* Animated gradient border effect */}
      <div className={`absolute -inset-0.5 bg-linear-to-r ${gradient} rounded-3xl opacity-20 group-hover:opacity-30 blur transition-all duration-300`}></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`relative bg-linear-to-br ${bgColor} p-8 border-b-2 border-gray-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <div className={`p-3 bg-white rounded-2xl shadow-lg ring-4 ${ringColor}`}>
                <Activity className="w-8 h-8 text-gray-700" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Risk Analysis</h2>
                <p className="text-gray-600 text-sm">
                  AI-powered risk assessment
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Risk Score Display */}
          <div className="text-center mb-8">
            <div className={`relative inline-flex items-center justify-center w-40 h-40 rounded-full bg-linear-to-br ${bgColor} border-4 border-white shadow-2xl ring-4 ${ringColor}`}>
              {/* Animated ring */}
              <div className={`absolute inset-0 rounded-full bg-linear-to-r ${gradient} opacity-20 animate-pulse`}></div>
              
              <div className="relative text-center">
                <div className={`text-5xl font-black ${textColor}`}>
                  {risk.riskScore}
                </div>
                <div className="text-xs text-gray-600 font-semibold mt-1 tracking-wide uppercase">
                  Risk Score
                </div>
              </div>
            </div>
          </div>
          
          {/* Risk Level Badge */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl bg-linear-to-r ${badgeGradient} text-white font-bold text-xl shadow-2xl transform hover:scale-105 transition-transform`}>
              <div className="text-white">
                {icon}
              </div>
              <span>{risk.riskLevel}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner mb-4">
            <div 
              className={`absolute top-0 left-0 h-full bg-linear-to-r ${gradient} rounded-full transition-all duration-1000 ease-out shadow-lg`}
              style={{ width: `${risk.riskScore}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
          </div>
          
          {/* Scale Labels */}
          <div className="flex justify-between text-xs text-gray-500 font-semibold mb-8">
            <span>0 • Low</span>
            <span>50 • Moderate</span>
            <span>100 • High</span>
          </div>
          
          {/* Risk Description */}
          <div className={`p-5 bg-linear-to-br ${bgColor} rounded-2xl border-2 ${textColor.replace('text-', 'border-').replace('-700', '-200')}`}>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">
              {risk.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
