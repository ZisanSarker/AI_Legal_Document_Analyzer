"use client";

import React, { useState } from "react";
import DOMPurify from "dompurify";

interface Clause {
  type?: string;
  text?: string;
  summary?: string;
  risk?: string;
  anomalies?: string[];
}

interface SummaryProps {
  summary: {
    document_summary_text?: string;
    clauses?: Clause[];
    key_clauses?: string[];
    overall_risk_level?: string;
    high_risk_count?: number;
    missing_required_clauses?: string[];
    potential_issues?: string[];
  };
}

const Summary: React.FC<SummaryProps> = ({ summary }) => {
  const [expandedClauses, setExpandedClauses] = useState<number[]>([]);

  if (!summary || Object.keys(summary).length === 0) return null;

  const {
    document_summary_text,
    clauses,
    key_clauses,
    overall_risk_level,
    high_risk_count,
    missing_required_clauses,
    potential_issues,
  } = summary;

  const toggleClause = (index: number) => {
    setExpandedClauses((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const riskColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-100";
      case "moderate":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const highlightKeywords = (text: string) => {
    const patterns = [
      { pattern: /(\d{1,2}-[A-Za-z]{3}-\d{4})/g, replacement: '<strong>$1</strong>' },
      { pattern: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Technologies|Corporation|Inc\.|LLC|Ltd\.|Company|Corp\.))/g, replacement: '<strong>$1</strong>' },
      { pattern: /(Chittagong|Bangladesh|New York|California|Texas|United States|USA)/g, replacement: '<strong>$1</strong>' },
      { pattern: /(\$\d+(?:,\d{3})*(?:\.\d{2})?)/g, replacement: '<strong>$1</strong>' },
    ];
    
    let highlighted = text;
    patterns.forEach(({ pattern, replacement }) => {
      highlighted = highlighted.replace(pattern, replacement);
    });
    
    return highlighted;
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 sm:p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 border-b pb-2">
        Document Summary
      </h2>

      <div className="space-y-4">
        {document_summary_text && document_summary_text.trim() && (
          <div className="p-4 sm:p-5 rounded-lg bg-blue-50 border border-blue-100">
            <div
              className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(highlightKeywords(document_summary_text)),
              }}
            />
          </div>
        )}

        {key_clauses && key_clauses.length > 0 && (
          <div className="p-4 sm:p-5 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm sm:text-base text-gray-700">
              <span className="font-semibold">Key clauses identified:</span>{" "}
              <span className="font-medium">{key_clauses.join(", ")}</span>
            </p>
          </div>
        )}

        {(overall_risk_level || (high_risk_count !== undefined && high_risk_count > 0)) && (
          <div className="p-4 sm:p-5 rounded-lg bg-red-50 border border-red-100">
            <div className="space-y-1">
              {overall_risk_level && (
                <p className="text-sm sm:text-base text-gray-700">
                  <span className="font-semibold">Overall risk level:</span>{" "}
                  <span className="font-bold text-red-600">{overall_risk_level}</span>
                </p>
              )}
              {high_risk_count !== undefined && high_risk_count > 0 && (
                <p className="text-sm sm:text-base text-gray-700">
                  <span className="font-semibold">{high_risk_count}</span>{" "}
                  {high_risk_count === 1 ? "high-risk clause" : "high-risk clauses"} detected.
                </p>
              )}
            </div>
          </div>
        )}

        {missing_required_clauses && missing_required_clauses.length > 0 && (
          <div className="p-4 sm:p-5 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm sm:text-base text-gray-700 mb-2">
              <span className="font-semibold">Missing required clauses:</span>
            </p>
            <p className="text-sm sm:text-base text-gray-700 font-medium">
              {missing_required_clauses.join(", ")}
            </p>
          </div>
        )}

        {potential_issues && potential_issues.length > 0 && (
          <div className="p-4 sm:p-5 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-sm sm:text-base text-gray-700 mb-2">
              <span className="font-semibold">Potential issues:</span>
            </p>
            <p className="text-sm sm:text-base text-gray-700">{potential_issues.join("; ")}</p>
          </div>
        )}
      </div>

      {clauses && clauses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Detailed Clauses</h3>
          <div className="space-y-4">
            {clauses.map((clause, index) => {
              const isExpanded = expandedClauses.includes(index);
              return (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white"
                  onClick={() => toggleClause(index)}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{clause.type || "Clause"}</p>
                    {clause.risk && (
                      <span
                        className={`text-sm font-semibold px-2 py-1 rounded-full ${riskColor(
                          clause.risk
                        )}`}
                      >
                        {clause.risk}
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-2 text-gray-700 space-y-2">
                      {clause.text && (
                        <p>
                          <strong>Text:</strong> {clause.text}
                        </p>
                      )}
                      {clause.summary && (
                        <p>
                          <strong>Summary:</strong> {clause.summary}
                        </p>
                      )}
                      {clause.anomalies && clause.anomalies.length > 0 && (
                        <div>
                          <strong>Anomalies:</strong>
                          <ul className="list-disc list-inside ml-4 text-red-600">
                            {clause.anomalies.map((anom, idx) => (
                              <li key={idx}>{anom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summary;
