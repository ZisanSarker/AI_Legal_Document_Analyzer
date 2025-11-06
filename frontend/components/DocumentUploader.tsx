"use client";

import { useState, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { Upload, FileText, XCircle, Loader2 } from "lucide-react";

interface DocumentUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const DocumentUploader = ({ onFileSelect }: DocumentUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = (selected: File) => {
    if (
      !selected.type.startsWith("image/") &&
      selected.type !== "application/pdf"
    ) {
      alert("Please upload a valid document (PDF or image).");
      return;
    }

    setFile(selected);

    if (selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }

    onFileSelect?.(selected);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    onFileSelect?.(null);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50 shadow-lg"
            : "border-gray-300 bg-white hover:bg-gray-50"
        }`}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          id="documentUpload"
          onChange={handleChange}
          className="hidden"
        />

        {/* Uploading Spinner */}
        {uploading && (
          <div className="flex flex-col items-center space-y-3 text-blue-600 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-medium">Analyzing document...</p>
          </div>
        )}

        {/* Preview State */}
        {!uploading && file ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-40 h-40">
              {preview ? (
                <Image
                  src={preview}
                  alt="Document preview"
                  fill
                  className="object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-500" />
                </div>
              )}
              <button
                onClick={handleRemove}
                className="absolute -top-3 -right-3 bg-white rounded-full shadow-md hover:bg-gray-100 transition p-1"
                aria-label="Remove file"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="text-center">
              <p className="font-medium text-gray-800 text-sm truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ) : null}

        {/* Empty / Default State */}
        {!file && !uploading && (
          <label
            htmlFor="documentUpload"
            className="flex flex-col items-center space-y-4 text-center"
          >
            <div
              className={`p-4 rounded-full border ${
                dragActive ? "border-blue-400 bg-blue-100" : "border-gray-300"
              } transition`}
            >
              <Upload
                className={`w-8 h-8 ${
                  dragActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="font-medium text-gray-700">
                Drag & drop your legal document
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse (PDF, JPG, PNG)
              </p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
