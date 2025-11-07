"use client";

import { useState } from "react";
import { ArrowLeft, ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronRight, Sparkles, Shield, Eye, FileWarning } from "lucide-react";

interface FraudResultsProps {
  result: any;
  onBack: () => void;
}

function Section({ title, color, bgGradient, borderColor, items, level }: { 
  title: string; 
  color: string; 
  bgGradient: string;
  borderColor: string;
  items: any[];
  level: 'high' | 'medium' | 'low';
}) {
  const [open, setOpen] = useState(true);
  const riskCount = items?.length || 0;
  
  const icons = {
    high: ShieldAlert,
    medium: AlertTriangle,
    low: Info
  };
  
  const Icon = icons[level];
  
  return (
    <div className={`rounded-3xl overflow-hidden shadow-xl ${borderColor} border-2 transition-all hover:shadow-2xl`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full px-6 py-5 flex items-center justify-between ${bgGradient} text-white font-bold relative overflow-hidden group`}
      >
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-lg">{title}</div>
            <div className="text-xs text-white/80 font-normal">
              {riskCount === 0 ? 'No issues found' : `${riskCount} ${riskCount === 1 ? 'issue' : 'issues'} detected`}
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-2xl font-bold">{riskCount}</span>
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>
      {open && (
        <div className="bg-white">
          {riskCount === 0 ? (
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full ${bgGradient} mx-auto mb-4 flex items-center justify-center`}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-500 font-medium">No {level} risk indicators found</p>
              <p className="text-sm text-gray-400 mt-1">This is great news! Keep up the good work.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {items.map((it: any, idx: number) => (
                <div key={idx} className="group relative">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  <div className="relative bg-white rounded-2xl p-5 border-2 border-gray-100 group-hover:border-gray-200 transition-all">
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${bgGradient} flex items-center justify-center shrink-0 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {it.category && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                              {String(it.category)}
                            </span>
                          )}
                          {it.specific_finding && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-purple-500 to-pink-600 text-white shadow-md">
                              {String(it.specific_finding)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-gray-900">
                          {it.specific_finding || it.title || it.name || "Potential issue"}
                        </h4>
                        {it.location_and_explanation && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {it.location_and_explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FraudResults({ result, onBack }: FraudResultsProps) {
  // Try to normalize a few expected shapes
  const remote = result?.remote_response || result;

  // Extract arrays from common key variants
  const highRaw =
    remote?.high_risk_indicators ||
    remote?.high_risk ||
    remote?.high ||
    remote?.highRisk ||
    [];
  const mediumRaw =
    remote?.medium_risk_indicators ||
    remote?.medium_risk ||
    remote?.medium ||
    remote?.mediumRisk ||
    [];
  const lowRaw =
    remote?.low_risk_indicators ||
    remote?.low_risk ||
    remote?.low ||
    remote?.lowRisk ||
    [];

  // Normalize item keys so UI can render consistently
  function normalizeItems(items: any[]): any[] {
    if (!Array.isArray(items)) return [];
    return items.map((it) => {
      const obj = it || {};
      const locationAndExplanation =
        obj["location_&_explanation"] ||
        obj["location_and_explanation"] ||
        obj["location & explanation"] ||
        obj["explanation"] ||
        obj["details"] ||
        obj["description"]; // multiple fallbacks
      return {
        risk_level: obj.risk_level || obj.level || obj.risk || "",
        category: obj.fraud_category || obj.category || obj.type || "",
        specific_finding: obj.specific_finding || obj.finding || obj.title || obj.name || "",
        location_and_explanation: locationAndExplanation || "",
      };
    });
  }

  const high = normalizeItems(highRaw);
  const medium = normalizeItems(mediumRaw);
  const low = normalizeItems(lowRaw);

  const hasStructured = [high, medium, low].some((arr) => Array.isArray(arr) && arr.length);

  const totalHigh = high.length;
  const totalMedium = medium.length;
  const totalLow = low.length;
  const totalAll = totalHigh + totalMedium + totalLow;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={onBack}
            className="group mb-6 px-5 py-2.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2 transition-all shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to Upload</span>
          </button>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Fraud Detection Results</h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  AI-assisted forensic review of your document
                </p>
              </div>
            </div>
          </div>
        </div>

        {hasStructured ? (
          <>
            {/* Summary Bar */}
            <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative overflow-hidden rounded-3xl p-6 bg-linear-to-br from-red-500 to-red-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wide">High Risk</span>
                  </div>
                  <div className="text-5xl font-black mb-1">{totalHigh}</div>
                  <div className="text-sm text-white/80">Critical indicators</div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl p-6 bg-linear-to-br from-orange-500 to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wide">Medium Risk</span>
                  </div>
                  <div className="text-5xl font-black mb-1">{totalMedium}</div>
                  <div className="text-sm text-white/80">Suspicious anomalies</div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl p-6 bg-linear-to-br from-amber-400 to-amber-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wide">Low Risk</span>
                  </div>
                  <div className="text-5xl font-black mb-1">{totalLow}</div>
                  <div className="text-sm text-white/80">Minor irregularities</div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl p-6 bg-linear-to-br from-indigo-500 to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <FileWarning className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wide">Total Issues</span>
                  </div>
                  <div className="text-5xl font-black mb-1">{totalAll}</div>
                  <div className="text-sm text-white/80">All findings</div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Section 
                title="High Risk Indicators" 
                color="text-red-600"
                bgGradient="bg-linear-to-r from-red-500 to-red-700"
                borderColor="border-red-200"
                items={high}
                level="high"
              />
              <Section 
                title="Medium Risk Indicators" 
                color="text-orange-600"
                bgGradient="bg-linear-to-r from-orange-500 to-orange-700"
                borderColor="border-orange-200"
                items={medium}
                level="medium"
              />
              <Section 
                title="Low Risk Indicators" 
                color="text-amber-600"
                bgGradient="bg-linear-to-r from-amber-400 to-amber-600"
                borderColor="border-amber-200"
                items={low}
                level="low"
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FileWarning className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Raw Result</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">The response format is not recognized. Showing raw data for review.</p>
            <div className="bg-gray-900 rounded-2xl p-6 overflow-auto max-h-[60vh]">
              <pre className="text-xs text-green-400 font-mono">
                <code>{JSON.stringify(remote, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
