"use client";

import React from "react";
import { PolicyCategory } from "./policyData";

interface PolicyDetailsModalProps {
  category: PolicyCategory | null;
  onClose: () => void;
}

export const PolicyDetailsModal: React.FC<
  PolicyDetailsModalProps
> = ({ category, onClose }) => {
  if (!category) return null;

  return (
    <div
      className="policy-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="policy-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="policy-modal-header"
          style={{
            background: category.gradient,
          }}
        >
          <div>
            <span className="policy-modal-badge">
              {category.badge}
            </span>

            <h2>{category.title}</h2>

            <p>{category.description}</p>
          </div>

          <button
            className="policy-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="policy-modal-content">

          {/* Evaluator */}
          <section className="evaluator-card">
            <div className="evaluator-icon">
              👤
            </div>

            <div>
              <span className="section-label">
                EVALUATED BY
              </span>

              <h3>
                {category.evaluator.name}
              </h3>

              <p>
                {category.evaluator.role}
              </p>

              <a
                href={`tel:${category.evaluator.mobile.replace(
                  /\s/g,
                  ""
                )}`}
              >
                📞 {category.evaluator.mobile}
              </a>
            </div>
          </section>

          {/* Scoring Sections */}
          {category.sections.map(
            (section, sectionIndex) => (
              <section
                className="policy-detail-section"
                key={sectionIndex}
              >
                <h3>{section.title}</h3>

                <div className="score-table">
                  {section.rows.map(
                    (row, rowIndex) => (
                      <div
                        className="score-row"
                        key={rowIndex}
                      >
                        <span>
                          {row.label}
                        </span>

                        <strong>
                          {row.mark}{" "}
                          {typeof row.mark ===
                          "number"
                            ? "marks"
                            : ""}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}

          {/* Conditions */}
          {category.conditions &&
            category.conditions.length > 0 && (
              <section className="policy-info-box">
                <h3>Conditions</h3>

                <ul>
                  {category.conditions.map(
                    (condition, index) => (
                      <li key={index}>
                        {condition}
                      </li>
                    )
                  )}
                </ul>
              </section>
            )}

          {/* Notes */}
          {category.notes &&
            category.notes.length > 0 && (
              <section className="policy-warning-box">
                <h3>Important Notes</h3>

                <ul>
                  {category.notes.map(
                    (note, index) => (
                      <li key={index}>
                        {note}
                      </li>
                    )
                  )}
                </ul>
              </section>
            )}

          {/* Documentation */}
          <section className="documentation-card">
            <h3>Documentation</h3>

            <div className="documentation-grid">
              <div>
                <span>Documentation In-charge</span>
                <strong>
                  {category.documentationInCharge}
                </strong>
              </div>

              <div>
                <span>Supporting Document</span>
                <strong>
                  {category.supportingDocument}
                </strong>
              </div>

              <div>
                <span>Date of Submission</span>
                <strong>
                  {category.submissionDate}
                </strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
