"use client";

import DocumentUploader from "@/components/DocumentUploader";
import Summary from "@/components/Summary";
import ProgressIndicator from "@/components/ProgressIndicator";
import { api } from "@/lib/api";
import { useState } from "react";

type ProgressStage = "idle" | "uploading" | "extracting" | "analyzing";

export default function UploadPage() {
  const [summary, setSummary] = useState({});
  const [progress, setProgress] = useState<ProgressStage>("idle");

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setProgress("idle");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress("uploading");
      const extracts = await api.post("/docs/extract", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProgress("extracting");
      const text = extracts.data.text;
      
      setProgress("analyzing");
      const semantics = await api.post(
        "/semantic/analyze",
        { text },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSummary(semantics.data.data);
      setProgress("idle");
    } catch (err) {
      console.error("Upload failed:", err);
      setProgress("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Upload Legal Document
        </h1>
        <p className="text-gray-600 mb-10 text-lg">
          Drag and drop your legal file to analyze clauses, summaries, and key insights.
        </p>
        <DocumentUploader onFileSelect={handleFileSelect} />
        <ProgressIndicator stage={progress} />
        <Summary summary={summary} />
      </div>
    </div>
  );
}
