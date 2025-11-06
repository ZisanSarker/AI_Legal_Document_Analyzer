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
    document_summary?: string;
    clauses?: Clause[];
    overall_risk_level?: string;
    missing_required_clauses?: string[];
    potential_issues?: string[];
  };
}

const Summary: React.FC<SummaryProps> = ({ summary }) => {
  const [expandedClauses, setExpandedClauses] = useState<number[]>([]);

  if (!summary || Object.keys(summary).length === 0) return null;

  const {
    document_summary,
    clauses,
    overall_risk_level,
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

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-4 border-b pb-2">
        Document Summary
      </h2>

      {/* Overall Document Summary */}
      {document_summary && (
        <div
          className="prose text-gray-700 mb-6 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(document_summary),
          }}
        />
      )}

      {/* Overall Risk */}
      {overall_risk_level && (
        <div
          className={`inline-block px-3 py-1 rounded-full font-semibold mb-4 ${riskColor(
            overall_risk_level
          )}`}
        >
          Overall Risk: {overall_risk_level}
        </div>
      )}

      {/* Clauses */}
      {clauses && clauses.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Key Clauses</h3>
          <div className="space-y-4">
            {clauses.map((clause, index) => {
              const isExpanded = expandedClauses.includes(index);
              return (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
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

      {/* Missing Required Clauses */}
      {missing_required_clauses && missing_required_clauses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">
            Missing Required Clauses
          </h3>
          <ul className="list-disc list-inside text-red-600 space-y-1">
            {missing_required_clauses.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Issues */}
      {potential_issues && potential_issues.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Potential Issues</h3>
          <ul className="list-disc list-inside text-red-500 space-y-1">
            {potential_issues.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Summary;
