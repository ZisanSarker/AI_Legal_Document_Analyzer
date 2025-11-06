"use client";

import DocumentUploader from "@/components/DocumentUploader";
import Summary from "@/components/Summary";
import { api } from "@/lib/api";
import { useState } from "react";

export default function UploadPage() {
  const [summary, setSummary] = useState({});
  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const extracts = await api.post("/docs/extract", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const text = extracts.data.text;
      const preprocess = await api.post(
        "/preprocessing/preprocess",
        { text },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const chunks = preprocess.data.data.chunks;
      const semantics = await api.post("/semantic/analyze", { chunks });

      setSummary(semantics.data.data);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-semibold mb-2">Upload Legal Document</h1>
        <p className="text-gray-600 mb-10">
          Drag and drop your legal file to analyze clauses, summaries, and key
          insights.
        </p>
        <DocumentUploader onFileSelect={handleFileSelect} />

        <Summary summary={summary} />
      </div>
    </div>
  );
}
