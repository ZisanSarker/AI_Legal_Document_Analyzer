"use client";

import { useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import SummaryCard from "@/components/SummaryCard";
import ClauseList from "@/components/ClauseList";
import RiskMeter from "@/components/RiskMeter";
import AnomalyBox from "@/components/AnomalyBox";
import LoaderOverlay from "@/components/LoaderOverlay";
import { uploadDocument, analyzeText } from "@/lib/api";
import { Scale, Shield, FileCheck } from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadComplete(false);
      setExtractedText("");
      return;
    }
    
    setUploading(true);
    try {
      const result = await uploadDocument(file);
      setExtractedText(result.text);
      setUploadComplete(true);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Failed to upload document.");
      setUploadComplete(false);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!extractedText) return;
    
    setLoading(true);
    try {
      const result = await analyzeText(extractedText);
      setData(result.data);
    } catch (err) {
      console.error("❌ Analysis failed:", err);
      alert("Failed to analyze document.");
    } finally {
      setLoading(false);
    }
  };

  const handleRiskAnalyze = async () => {
    if (!extractedText) return;
    
    setLoading(true);
    try {
      const result = await analyzeText(extractedText);
      setData(result.data);
    } catch (err) {
      console.error("❌ Risk analysis failed:", err);
      alert("Failed to perform risk analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleFraudDetection = async () => {
    if (!extractedText) return;
    
    setLoading(true);
    try {
      const result = await analyzeText(extractedText);
      setData(result.data);
    } catch (err) {
      console.error("❌ Fraud detection failed:", err);
      alert("Failed to perform fraud detection.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setUploadComplete(false);
    setExtractedText("");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Legal Document Analyzer</h1>
              <p className="text-xs text-gray-500">AI-Powered Contract Review</p>
            </div>
          </a>
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Accurate</span>
            </div>
          </div>
        </div>
      </header>

      {loading && <LoaderOverlay />}

      {!data ? (
        <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <DocumentUploader 
            onFileSelect={handleFileUpload} 
            onAnalyze={handleAnalyze}
            onRiskAnalyze={handleRiskAnalyze}
            onFraudDetection={handleFraudDetection}
            showAnalyzeButton={uploadComplete}
            isUploading={uploading}
          />
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-10">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={handleReset}
              className="group relative px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg transition-all font-semibold shadow-md hover:scale-105 flex items-center space-x-3"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Upload New Document</span>
            </button>
          </div>
          
          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Summary & Clauses */}
            <div className="lg:col-span-2 space-y-8">
              <SummaryCard summary={data.summary} />
              <ClauseList clauses={data.clauses} />
            </div>
            
            {/* Right Column - Risk & Anomalies */}
            <div className="space-y-8">
              <RiskMeter risk={data.risks} />
              <AnomalyBox anomalies={data.anomalies} />
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Legal Document Analyzer. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
