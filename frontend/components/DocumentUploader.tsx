"use client";

import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { Upload, FileText, XCircle, CheckCircle, File, ArrowRight, Loader2 } from "lucide-react";

interface DocumentUploaderProps {
  onFileSelect?: (file: File | null) => void;
  onAnalyze?: () => void;
  showAnalyzeButton?: boolean;
  isUploading?: boolean;
}

export default function DocumentUploader({ 
  onFileSelect, 
  onAnalyze, 
  showAnalyzeButton = false,
  isUploading = false
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  // Progress through upload steps when uploading
  useEffect(() => {
    if (isUploading) {
      setUploadStep(0);
      const timer1 = setTimeout(() => setUploadStep(1), 1500);  // Move to step 1 after 1.5s
      const timer2 = setTimeout(() => setUploadStep(2), 4000);  // Move to step 2 after 4s
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setUploadStep(0);
    }
  }, [isUploading]);

  const handleFile = (selected: File) => {
    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      alert("Please upload a valid document (PDF or image).");
      return;
    }

    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
    onFileSelect?.(selected);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemove = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onFileSelect?.(null);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Upload Container - Redesigned */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Content Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative transition-all duration-300 ${
            dragActive 
              ? "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 border-4 border-blue-400 border-dashed" 
              : "bg-linear-to-br from-white to-gray-50"
          }`}
        >
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            id="upload" 
            onChange={handleChange} 
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            // Uploading State - Redesigned Layout
            <div className="p-12">
              <div className="max-w-xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                  {/* Animated Icon with Rings */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
                    {/* Middle ring */}
                    <div className="absolute inset-2 border-4 border-blue-300 rounded-full animate-pulse"></div>
                    {/* Main circle */}
                    <div className="absolute inset-4 bg-linear-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="relative">
                        <Loader2 className="w-14 h-14 text-white animate-spin" />
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Title and Description */}
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Uploading Document
                  </h3>
                  <p className="text-lg text-gray-600">
                    Please wait while we process your file
                  </p>
                </div>

                {/* Progress Steps Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                  <div className="space-y-4">
                    {/* Step 1: Processing file */}
                    <div className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                      uploadStep >= 0 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border-2 border-gray-200'
                    }`}>
                      <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        uploadStep > 0 ? 'bg-green-500' : uploadStep === 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                      }`}>
                        {uploadStep > 0 ? (
                          <CheckCircle className="w-7 h-7 text-white" />
                        ) : (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${uploadStep >= 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                          {uploadStep > 0 ? 'File Processed Successfully' : 'Processing File'}
                        </p>
                        <p className="text-sm text-gray-500">Validating and preparing document</p>
                      </div>
                    </div>
                    
                    {/* Step 2: Extracting text */}
                    <div className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                      uploadStep >= 1 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border-2 border-gray-200'
                    }`}>
                      <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        uploadStep > 1 ? 'bg-green-500' : uploadStep === 1 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                      }`}>
                        {uploadStep > 1 ? (
                          <CheckCircle className="w-7 h-7 text-white" />
                        ) : (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${uploadStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                          {uploadStep > 1 ? 'Text Extracted Successfully' : uploadStep >= 1 ? 'Extracting Text' : 'Extract Text'}
                        </p>
                        <p className="text-sm text-gray-500">Using AI-powered OCR technology</p>
                      </div>
                    </div>
                    
                    {/* Step 3: Preparing for analysis */}
                    <div className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                      uploadStep >= 2 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border-2 border-gray-200'
                    }`}>
                      <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        uploadStep > 2 ? 'bg-green-500' : uploadStep === 2 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                      }`}>
                        {uploadStep > 2 ? (
                          <CheckCircle className="w-7 h-7 text-white" />
                        ) : (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${uploadStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                          {uploadStep > 2 ? 'Ready for Analysis' : uploadStep >= 2 ? 'Preparing for Analysis' : 'Prepare for Analysis'}
                        </p>
                        <p className="text-sm text-gray-500">Optimizing document structure</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Upload Progress</span>
                    <span className="text-sm font-bold text-blue-600">Step {uploadStep + 1} of 3</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                      style={{ 
                        width: `${((uploadStep + 1) / 3) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">Estimated time: 5-10 seconds</span>
                  </div>
                </div>
              </div>
            </div>
          ) : file ? (
            // File Selected State - Redesigned Card Layout
            <div className="p-10">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Main File Display Card */}
                <div className="bg-linear-to-br from-gray-50 to-white rounded-3xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-start space-x-6">
                      {/* File Icon/Preview */}
                      <div className="shrink-0">
                        {preview ? (
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                            <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                              <Image 
                                src={preview} 
                                alt="Preview" 
                                width={160} 
                                height={160} 
                                className="object-cover" 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute -inset-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-3xl blur opacity-25"></div>
                            <div className="relative w-32 h-32 bg-linear-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
                              <FileText className="w-16 h-16 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* File Details */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 truncate" title={file.name}>
                            {file.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold uppercase">
                              {file.type.split('/')[1]}
                            </div>
                          </div>
                        </div>
                        
                        {/* File Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <p className="text-sm font-semibold text-green-600">✓ Uploaded</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Ready</p>
                            <p className="text-sm font-semibold text-blue-600">For Analysis</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success Banner */}
                  {showAnalyzeButton && (
                    <div className="bg-linear-to-r from-green-500 to-emerald-500 px-8 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="text-white">
                            <p className="font-bold text-lg">Upload Successful!</p>
                            <p className="text-sm text-green-50">Document is ready for AI analysis</p>
                          </div>
                        </div>
                        <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons Row */}
                <div className="flex gap-4">
                  <button
                    onClick={handleRemove}
                    className="flex-1 group py-4 px-6 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-2xl transition-all flex items-center justify-center space-x-3 font-semibold border-2 border-red-200 hover:border-red-400 shadow-md hover:shadow-lg"
                  >
                    <XCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Remove</span>
                  </button>
                  
                  <button className="flex-1 py-4 px-6 bg-gray-100 text-gray-400 rounded-2xl font-semibold border-2 border-gray-200 cursor-not-allowed" disabled>
                    <span>Replace</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Initial Upload State - Redesigned
            <div className="p-16">
              <label 
                htmlFor="upload" 
                className={`block ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
              >
                <div className="max-w-2xl mx-auto">
                  {/* Main Upload Area */}
                  <div className={`relative border-4 border-dashed rounded-3xl p-12 transition-all duration-300 ${
                    isHovered && !isUploading 
                      ? 'border-blue-400 bg-blue-50/50 transform scale-105' 
                      : 'border-gray-300 bg-white/50'
                  }`}>
                    {/* Upload Icon */}
                    <div className="text-center mb-8">
                      <div className={`relative inline-block transition-transform duration-300 ${isHovered && !isUploading ? 'scale-110 -translate-y-2' : 'scale-100'}`}>
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                        <div className="relative w-32 h-32 bg-linear-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto">
                          <Upload className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="text-center space-y-4">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          Drop your document here
                        </h3>
                        <p className="text-lg text-gray-600">
                          or <span className="text-blue-600 font-semibold hover:text-blue-700 underline decoration-2 underline-offset-2">browse files</span> from your computer
                        </p>
                      </div>
                      
                      {/* Supported Formats */}
                      <div className="flex items-center justify-center gap-6 pt-6">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                          <FileText className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-gray-700">PDF</span>
                        </div>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                          <File className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold text-gray-700">Images</span>
                        </div>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-semibold text-gray-700">Max 10MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Drag Overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 backdrop-blur-md flex items-center justify-center pointer-events-none rounded-3xl">
              <div className="text-center space-y-4 animate-in zoom-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform scale-110">
                    <Upload className="w-12 h-12 text-white animate-bounce" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 mb-1">Release to Upload</p>
                  <p className="text-blue-600">Drop your file here</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analyze Button - Enhanced */}
      {showAnalyzeButton && (
        <div className="mt-10 space-y-6">
          {/* Main Analyze Button */}
          <div className="relative">
            {/* Animated background glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 animate-pulse"></div>
            
            <button
              onClick={onAnalyze}
              className="relative group w-full px-8 py-5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all font-bold text-xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
            >
              {/* Icon with animation */}
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              
              <span>Analyze Document</span>
              
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-center space-x-2 text-blue-600 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wide">Powered by AI</span>
              </div>
              <p className="text-sm text-gray-600">Advanced analysis</p>
            </div>
            
            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-center space-x-2 text-purple-600 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wide">Fast Results</span>
              </div>
              <p className="text-sm text-gray-600">5-10 seconds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
