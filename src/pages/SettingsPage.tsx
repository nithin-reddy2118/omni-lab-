import React, { useState } from 'react';
import { Download, Globe, Settings, Trash2 } from 'lucide-react';
import { useLab } from '../context/LabContext';
import type { LanguageCode } from '../types/science';
import { Modal } from '../components/ui/Modal';

export function SettingsPage() {
  const {
    language,
    setLanguage,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    fontScale,
    setFontScale,
    aiConfigured,
    exportBackupJson,
    clearAllLocalData,
  } = useLab();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  return (
    <div className="space-y-8 pb-16 max-w-3xl">
      <div>
        <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <Settings className="w-4 h-4" />
          Language · Accessibility · Offline Storage
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
          Settings
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Customize language, motion preferences, text readability, and manage your locally saved laboratory data.
        </p>
      </div>

      {/* Language Support */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Globe className="w-4 h-4 text-blue-700" />
          Platform Language
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {(
            [
              { code: 'en', name: 'Simple English', native: 'English' },
              { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
              { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
            ] as { code: LanguageCode; name: string; native: string }[]
          ).map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`p-3.5 rounded-lg border text-left transition-colors ${
                language === lang.code
                  ? 'border-blue-700 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900'
              }`}
            >
              <div className="text-sm font-semibold">{lang.native}</div>
              <div className="text-xs opacity-80">{lang.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Accessibility */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Accessibility Preferences</h2>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <div className="text-sm font-medium text-slate-900">Reduced Motion</div>
            <div className="text-xs text-slate-600">Minimizes animations and smooth scrolling transitions.</div>
          </div>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="w-5 h-5 accent-blue-700"
          />
        </label>

        <label className="flex items-center justify-between gap-4 cursor-pointer pt-3 border-t border-slate-100">
          <div>
            <div className="text-sm font-medium text-slate-900">High Contrast Secondary Text</div>
            <div className="text-xs text-slate-600">Darkens secondary labels for crisp daylight reading.</div>
          </div>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
            className="w-5 h-5 accent-blue-700"
          />
        </label>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div>
            <div className="text-sm font-medium text-slate-900">Text Size</div>
            <div className="text-xs text-slate-600">Increase base typography size across the interface.</div>
          </div>
          <div className="flex gap-2">
            {(['normal', 'large'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontScale(sz)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${
                  fontScale === sz
                    ? 'border-blue-700 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Offline & Service Capabilities */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Data Persistence &amp; Offline Capabilities</h2>
        <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <p>
            • <strong className="text-slate-900">Offline Local Access:</strong> Saved trials, lab reports, custom experiments, and private innovation drafts are persisted locally in your browser so you can inspect and export them anytime.
          </p>
          <p>
            • <strong className="text-slate-900">Online AI Features:</strong> Science Explorer, Algorithm AI Parser, AI Experiment Creator, Science Detective, and AI Discovery Explanations require an active connection to the server and <code className="font-mono">GEMINI_API_KEY</code> ({aiConfigured === true ? 'Server AI Ready' : aiConfigured === false ? 'Requires GEMINI_API_KEY in Secrets' : 'Checking server...'}). Online AI does not operate offline.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={exportBackupJson}
            className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 hover:border-blue-400 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-700" />
            Export Saved Data (JSON)
          </button>
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-100 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset All Local Lab Data
          </button>
        </div>
      </section>

      <Modal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Confirm Reset Local Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently delete your locally saved trials, reports, custom experiments, and private innovation drafts from this browser.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllLocalData();
                setConfirmClearOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-rose-700 text-white text-sm font-semibold"
            >
              Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
