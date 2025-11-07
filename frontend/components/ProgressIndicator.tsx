"use client";

import { Loader2 } from "lucide-react";

type ProgressStage = "idle" | "uploading" | "extracting" | "analyzing";

interface ProgressIndicatorProps {
  stage: ProgressStage;
}

const messages: Record<Exclude<ProgressStage, "idle">, string> = {
  uploading: "File uploading...",
  extracting: "Extracting text from the uploaded file...",
  analyzing: "Preprocessing and analyzing content...",
};

export default function ProgressIndicator({ stage }: ProgressIndicatorProps) {
  if (stage === "idle") return null;

  return (
    <div className="mt-8 flex flex-col items-center justify-center space-y-4 transition-all duration-500 ease-in-out">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="relative bg-white rounded-full p-4 shadow-lg">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
      <p className="text-lg font-medium text-gray-700 animate-pulse transition-opacity duration-300">
        {messages[stage]}
      </p>
    </div>
  );
}

