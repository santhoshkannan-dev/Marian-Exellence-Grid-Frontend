'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { BotAvatar } from './BotAvatar';

// Target Phone Numbers (Indian numbers with 91 country prefix)
const PHONE_STUDENT = '919074033475';      // Normal Student -> 9074033475
const PHONE_DQC_REP = '919400879315';      // DQC / Student Rep -> 9400879315
const PHONE_TEACHER_EVAL = '918606145989'; // Teacher / Evaluator -> 8606145989

type TargetCategory = 'student' | 'dqc_rep' | 'teacher_evaluation';

// Inline SVG Icons
const Icons = {
  Help: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  Tag: ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  ),
  Message: ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Upload: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  ),
  Send: ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  Close: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Check: ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Trash: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  WhatsApp: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.275-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.424-1.496-.895-.798-1.5-1.785-1.676-2.086-.175-.301-.019-.464.132-.614.136-.134.301-.351.452-.526.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.633-.928-2.235-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01s-.527.075-.803.376c-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.2 2.123 3.242 5.144 4.547.718.311 1.278.497 1.716.637.722.23 1.378.197 1.897.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.352z" />
      <path d="M12.04 2C6.54 2 2.07 6.47 2.07 11.97c0 1.99.59 3.93 1.71 5.58L2 22l4.61-1.71c1.58 1.01 3.42 1.55 5.43 1.55 5.5 0 9.97-4.47 9.97-9.97C22.01 6.47 17.54 2 12.04 2zm0 18.23c-1.75 0-3.46-.48-4.96-1.39l-.36-.21-3.69 1.37 1.39-3.6-.23-.37a8.213 8.213 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.25-8.24 8.25z" />
    </svg>
  ),
  External: ({ size = 13 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
};

export const ChatBotBugReporter: React.FC = () => {
  const pathname = usePathname();
  const { currentUserInfo, currentRole } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [targetCategory, setTargetCategory] = useState<TargetCategory>('student');

  // Submission & UI feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReportData, setSubmittedReportData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-determine target category based on current pathname and role
  useEffect(() => {
    const isTeacherOrEvaluator =
      pathname.startsWith('/teacher') ||
      pathname.startsWith('/evaluator') ||
      currentRole === 'teacher' ||
      currentRole === 'faculty' ||
      currentRole === 'evaluator';

    const isDqcOrRep =
      currentRole === 'dqc' ||
      currentRole === 'rep' ||
      currentRole === 'student_rep';

    if (isTeacherOrEvaluator) {
      setTargetCategory('teacher_evaluation');
    } else if (isDqcOrRep) {
      setTargetCategory('dqc_rep');
    } else {
      setTargetCategory('student');
    }
  }, [pathname, currentRole]);

  // Handle screenshot selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      setScreenshotFile(file);
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreview(previewUrl);
      setErrorMessage('');
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to get destination details
  const getDestinationInfo = (category: TargetCategory) => {
    switch (category) {
      case 'student':
        return {
          label: 'Student Portal',
          phone: PHONE_STUDENT,
          buttonText: 'Send to Student Coordinator'
        };
      case 'dqc_rep':
        return {
          label: 'DQC / Student Representative',
          phone: PHONE_DQC_REP,
          buttonText: 'Send to DQC / Student Rep'
        };
      case 'teacher_evaluation':
        return {
          label: 'Teacher & Evaluation Desk',
          phone: PHONE_TEACHER_EVAL,
          buttonText: 'Send to Teacher & Evaluation Desk'
        };
    }
  };

  // Build formatted WhatsApp message text
  const generateWhatsAppMessage = (category: TargetCategory) => {
    const reporter = currentUserInfo?.name || currentUserInfo?.email || 'Student / User';
    const roleText = currentRole ? currentRole.toUpperCase() : 'PORTAL USER';
    const timeNow = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const info = getDestinationInfo(category);

    return (
      `*🚨 MARIAN EXCELLENCE GRID - HELP & SUPPORT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Issue:* ${title.trim()}\n` +
      `🎯 *Destination:* ${info.label}\n` +
      `👤 *Reporter:* ${reporter} (${roleText})\n` +
      `📍 *Page URL:* ${typeof window !== 'undefined' ? window.location.href : pathname}\n` +
      `🕒 *Reported At:* ${timeNow} (IST)\n\n` +
      `📝 *Description:*\n${description.trim()}\n` +
      (screenshotFile ? `\n📎 _(Screenshot attached: ${screenshotFile.name})_\n` : `\n`) +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Sent via Marian Excellence Grid Support_`
    );
  };

  // Open WhatsApp with specified number and prefilled text
  const openWhatsApp = (phone: string, text: string) => {
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Submit report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter an issue title.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please describe the issue.');
      return;
    }

    setIsSubmitting(true);

    const destInfo = getDestinationInfo(targetCategory);
    const messageText = generateWhatsAppMessage(targetCategory);

    // 1. Post to backend API
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('bug_type', 'General');
      formData.append('priority', 'Medium');
      formData.append('browser_device', typeof navigator !== 'undefined' ? navigator.userAgent : '');
      formData.append('page_url', typeof window !== 'undefined' ? window.location.href : pathname);
      formData.append('role_category', destInfo.label);
      formData.append('reporter_name', currentUserInfo?.name || currentUserInfo?.email || 'Guest');
      formData.append('reporter_email', currentUserInfo?.email || '');
      formData.append('whatsapp_numbers', destInfo.phone);

      if (screenshotFile) {
        formData.append('screenshot', screenshotFile);
      }

      await fetch('http://localhost:8000/api/bug-reports/', {
        method: 'POST',
        body: formData
      }).catch((err) => {
        console.warn('Backend logging notice:', err);
      });
    } catch (err) {
      console.warn('Backend dispatch notice:', err);
    }

    // 2. Launch WhatsApp directly to the exact target number
    openWhatsApp(destInfo.phone, messageText);

    // 3. Show confirmation state without displaying raw phone numbers
    setSubmittedReportData({
      title: title.trim(),
      targetCategory,
      destInfo,
      messageText
    });
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    handleRemoveScreenshot();
    setIsSubmitted(false);
    setSubmittedReportData(null);
    setErrorMessage('');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (isSubmitted) {
      resetForm();
    }
  };

  return (
    <>
      {/* Floating Trigger Container at Bottom-Right */}
      <div className="bug-bot-trigger-container">
        {/* Tooltip Prompt */}
        {!isOpen && !hasInteracted && (
          <div
            onClick={() => {
              setIsOpen(true);
              setHasInteracted(true);
            }}
            className="bug-bot-tooltip"
          >
            <span className="bug-bot-ping-dot" />
            <span>Help me</span>
          </div>
        )}

        {/* Mascot Floating Button */}
        <button
          id="btn-chatbot-bug-reporter"
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setHasInteracted(true);
          }}
          aria-label="Help me"
          className="bug-bot-trigger-btn"
        >
          {isOpen ? (
            <div className="bug-bot-close-icon-wrap">
              <Icons.Close size={26} />
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BotAvatar size={60} />
              <span className="bug-bot-online-badge" />
            </div>
          )}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="bug-bot-mobile-backdrop"
          onClick={handleClose}
        />
      )}

      {/* Modal Popup Window */}
      {isOpen && (
        <div className="bug-bot-modal-wrapper">
          {/* Header */}
          <div className="bug-bot-modal-header">
            <div className="bug-bot-header-left">
              <div className="bug-bot-icon-badge">
                <Icons.Help size={22} />
              </div>
              <div>
                <h2 className="bug-bot-title">Help me</h2>
                <p className="bug-bot-subtitle">Help us improve your experience.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="bug-bot-header-close-btn"
              aria-label="Close modal"
            >
              <Icons.Close size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="bug-bot-modal-body">
            {isSubmitted ? (
              /* Success View */
              <div className="bug-bot-success-view">
                <div className="bug-bot-success-icon-wrap">
                  <Icons.Check size={34} />
                </div>
                <div>
                  <h3 className="bug-bot-success-title">Report Prepared!</h3>
                  <p className="bug-bot-success-desc">
                    WhatsApp was launched to share your request. You can also send directly using the button below:
                  </p>
                </div>

                {/* WhatsApp Dispatch Button (No raw phone numbers displayed) */}
                <div className="bug-bot-dispatch-actions">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp(
                        submittedReportData?.destInfo?.phone || PHONE_STUDENT,
                        submittedReportData.messageText
                      )
                    }
                    className="bug-bot-whatsapp-btn"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.WhatsApp size={16} />
                      {submittedReportData?.destInfo?.buttonText || 'Send via WhatsApp'}
                    </span>
                    <Icons.External size={13} />
                  </button>
                </div>

                <div className="bug-bot-success-footer-actions">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bug-bot-secondary-action-btn"
                  >
                    Submit Another Request
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="bug-bot-done-btn"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Help Me Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {/* 3 Dispatch Destination Options */}
                <div className="bug-bot-route-box">
                  <div className="bug-bot-route-top">
                    <span>Dispatch Destination</span>
                    <span>Auto-Routed</span>
                  </div>
                  <div className="bug-bot-route-tabs">
                    {/* Option 1: Student (9074033475) */}
                    <button
                      type="button"
                      onClick={() => setTargetCategory('student')}
                      className={`bug-bot-route-btn ${targetCategory === 'student' ? 'active' : ''}`}
                    >
                      <span className="bug-bot-route-name">🎓 Student</span>
                    </button>

                    {/* Option 2: DQC / Rep (9400879315) */}
                    <button
                      type="button"
                      onClick={() => setTargetCategory('dqc_rep')}
                      className={`bug-bot-route-btn ${targetCategory === 'dqc_rep' ? 'active' : ''}`}
                    >
                      <span className="bug-bot-route-name">⭐ Dqc / Rep</span>
                    </button>

                    {/* Option 3: Teacher / Evaluator (8606145989) */}
                    <button
                      type="button"
                      onClick={() => setTargetCategory('teacher_evaluation')}
                      className={`bug-bot-route-btn ${targetCategory === 'teacher_evaluation' ? 'active' : ''}`}
                    >
                      <span className="bug-bot-route-name">👨‍🏫 Teacher / Eval</span>
                    </button>
                  </div>
                </div>

                {/* Issue Title */}
                <div className="bug-bot-field">
                  <label className="bug-bot-label">Issue Title</label>
                  <div className="bug-bot-input-wrapper">
                    <span className="bug-bot-input-icon">
                      <Icons.Tag size={15} />
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What went wrong?"
                      className="bug-bot-input"
                      required
                    />
                  </div>
                </div>

                {/* Description with live 0/300 counter */}
                <div className="bug-bot-field">
                  <div className="bug-bot-label">
                    <span>Description</span>
                    <span className="bug-bot-counter">{description.length}/300</span>
                  </div>
                  <div className="bug-bot-input-wrapper">
                    <span className="bug-bot-input-icon-top">
                      <Icons.Message size={15} />
                    </span>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) {
                          setDescription(e.target.value);
                        }
                      }}
                      rows={3}
                      maxLength={300}
                      placeholder="Describe the issue..."
                      className="bug-bot-textarea"
                      required
                    />
                  </div>
                </div>

                {/* Attach Screenshot */}
                <div className="bug-bot-field">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="bug-screenshot-input"
                  />

                  {screenshotPreview ? (
                    <div className="bug-bot-preview-box">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="bug-bot-preview-img"
                      />
                      <div className="bug-bot-preview-info">
                        <p className="bug-bot-preview-name">{screenshotFile?.name}</p>
                        <p className="bug-bot-preview-size">
                          {screenshotFile && (screenshotFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="bug-bot-preview-delete"
                        aria-label="Remove screenshot"
                      >
                        <Icons.Trash size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="bug-bot-upload-dropzone"
                    >
                      <div className="bug-bot-upload-icon-wrap">
                        <Icons.Upload size={18} />
                      </div>
                      <div>
                        <p className="bug-bot-upload-text-main">Attach Screenshot</p>
                        <p className="bug-bot-upload-text-sub">Click to upload image (Optional)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="bug-bot-error-banner">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="btn-submit-bug-report"
                  type="submit"
                  disabled={isSubmitting}
                  className="bug-bot-submit-btn"
                >
                  {isSubmitting ? (
                    <div className="bug-bot-spinner" />
                  ) : (
                    <>
                      <Icons.Send size={15} />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
