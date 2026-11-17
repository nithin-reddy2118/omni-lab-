import React, { useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, Globe, Lightbulb, Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { containsPersonalInfo, evaluateSafety, getSafetyBadgeMeta, sanitizePublicText } from '../engine/safetyEngine';
import type { InnovationItem } from '../types/science';
import { Modal } from '../components/ui/Modal';
import { DrawingCanvas } from '../components/ui/DrawingCanvas';

type HubTab = 'showcase' | 'builder' | 'my-ideas' | 'saved';

const CATEGORIES = [
  'All',
  'Water conservation',
  'Plastic waste',
  'Renewable energy',
  'Farming technology',
  'Accessible education',
  'Disaster preparedness',
  'Food waste',
  'Environmental monitoring',
  'Transportation',
  'Low-cost healthcare solutions',
];

export function InnovationHubPage() {
  const {
    publicInnovations,
    myInnovations,
    savedInnovationIds,
    saveInnovation,
    deleteMyInnovation,
    toggleSaveInnovation,
    recordSafetyCheck,
    t,
  } = useLab();

  const [activeTab, setActiveTab] = useState<HubTab>('showcase');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Water conservation');
  const [anonymousAlias, setAnonymousAlias] = useState('CuriousExplorer_01');
  const [problemSolved, setProblemSolved] = useState('');
  const [scientificPrinciple, setScientificPrinciple] = useState('');
  const [materialsAndDesign, setMaterialsAndDesign] = useState('');
  const [virtualPrototypeNotes, setVirtualPrototypeNotes] = useState('');
  const [drawingDataUrl, setDrawingDataUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [pendingIdea, setPendingIdea] = useState<InnovationItem | null>(null);

  const filteredPublic = useMemo(() => {
    const q = search.trim().toLowerCase();
    return publicInnovations.filter((item) => {
      if (item.status !== 'approved') return false;
      const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.scientificPrinciple.toLowerCase().includes(q) ||
        item.problemSolved.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [publicInnovations, search, categoryFilter]);

  const savedItems = useMemo(
    () => publicInnovations.filter((i) => savedInnovationIds.includes(i.id)),
    [publicInnovations, savedInnovationIds]
  );

  const handleCompleteBuilder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusNotice(null);

    const combinedText = `${title} ${problemSolved} ${scientificPrinciple} ${materialsAndDesign} ${virtualPrototypeNotes}`;
    if (containsPersonalInfo(combinedText) || containsPersonalInfo(anonymousAlias)) {
      setFormError(
        'For student privacy, please remove personal contact details (email, phone number, address, or school location) and use an anonymous alias.'
      );
      return;
    }

    const safety = evaluateSafety(combinedText);
    recordSafetyCheck(title, safety.level);
    if (safety.level === 'RED') {
      setFormError(`Blocked by Student Safety Guardian: ${safety.summary}`);
      return;
    }

    const now = new Date().toISOString();
    const newItem: InnovationItem = {
      id: `innov-${Date.now()}`,
      title: sanitizePublicText(title.trim()),
      category,
      anonymousAlias: anonymousAlias.trim() || 'StudentInnovator',
      problemSolved: sanitizePublicText(problemSolved.trim()),
      scientificPrinciple: sanitizePublicText(scientificPrinciple.trim()),
      materialsAndDesign: sanitizePublicText(materialsAndDesign.trim()),
      virtualPrototypeNotes: sanitizePublicText(virtualPrototypeNotes.trim()),
      drawingDataUrl: drawingDataUrl || undefined,
      status: 'draft',
      safetyLevel: safety.level,
      createdAt: now,
      updatedAt: now,
    };

    setPendingIdea(newItem);
  };

  const finalizeIdea = (choice: 'showcase' | 'private' | 'dismiss') => {
    if (!pendingIdea) return;
    if (choice === 'dismiss') {
      setPendingIdea(null);
      return;
    }
    const finalized: InnovationItem = {
      ...pendingIdea,
      status: choice === 'showcase' ? 'pending_approval' : 'draft',
      updatedAt: new Date().toISOString(),
    };
    saveInnovation(finalized);
    setPendingIdea(null);
    setTitle('');
    setProblemSolved('');
    setScientificPrinciple('');
    setMaterialsAndDesign('');
    setVirtualPrototypeNotes('');
    setDrawingDataUrl('');
    setActiveTab('my-ideas');
    setStatusNotice(
      choice === 'showcase'
        ? 'Submitted to Teacher & Guardian Approval Queue. It remains private until approved in Teacher Mode.'
        : 'Saved privately to My Innovations.'
    );
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Moderated Showcase · Anonymous Display Names · Teacher Approval Required
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Global Innovation Hub
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Turn scientific discoveries into safe student inventions. Draft privately, sketch prototypes, and submit for teacher review before sharing publicly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className="px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Innovation Idea
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          [
            { id: 'showcase', label: `Published Showcase (${filteredPublic.length})` },
            { id: 'builder', label: 'Innovation Builder' },
            { id: 'my-ideas', label: `My Ideas & Drafts (${myInnovations.length})` },
            { id: 'saved', label: `Saved Inspirations (${savedItems.length})` },
          ] as { id: HubTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-700 text-white font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {statusNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {statusNotice}
        </div>
      )}

      {/* TAB 1: PUBLISHED SHOWCASE */}
      {activeTab === 'showcase' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approved student innovations..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
            />
            <select
              aria-label="Filter showcase by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {filteredPublic.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              No approved showcase items match your filter.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublic.map((item) => {
                const isSaved = savedInnovationIds.includes(item.id);
                const meta = getSafetyBadgeMeta(item.safetyLevel);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>{item.category} · By {item.anonymousAlias}</span>
                        <span className={`font-semibold ${meta.colorClass}`}>{item.safetyLevel}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      {item.drawingDataUrl && (
                        <img
                          src={item.drawingDataUrl}
                          alt={`Prototype sketch for ${item.title}`}
                          className="w-full h-36 object-cover rounded-lg border border-slate-200"
                        />
                      )}
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-900">Problem:</strong> {item.problemSolved}
                      </p>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-900">Science Principle:</strong> {item.scientificPrinciple}
                      </p>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-900">Prototype Notes:</strong> {item.virtualPrototypeNotes}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-medium">Teacher Approved</span>
                      <button
                        type="button"
                        onClick={() => toggleSaveInnovation(item.id)}
                        className={`flex items-center gap-1 font-medium ${
                          isSaved ? 'text-amber-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {isSaved ? 'Saved Inspiration' : 'Save Inspiration'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INNOVATION BUILDER */}
      {activeTab === 'builder' && (
        <form onSubmit={handleCompleteBuilder} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-display font-bold text-slate-900">Innovation Builder</h2>
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Minor Privacy Protected · Anonymous Alias Only
            </span>
          </div>

          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {formError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Invention Title *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Passive Solar Milk Cooler"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Anonymous Display Alias (No real names or schools)</label>
              <input
                required
                type="text"
                value={anonymousAlias}
                onChange={(e) => setAnonymousAlias(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Safe Materials &amp; Design *</label>
              <input
                required
                type="text"
                value={materialsAndDesign}
                onChange={(e) => setMaterialsAndDesign(e.target.value)}
                placeholder="e.g. Terracotta pots, damp sand, digital probe"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Problem Solved *</label>
              <textarea
                required
                rows={3}
                value={problemSolved}
                onChange={(e) => setProblemSolved(e.target.value)}
                placeholder="Describe the community or environmental problem..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Scientific Principle Applied *</label>
              <textarea
                required
                rows={3}
                value={scientificPrinciple}
                onChange={(e) => setScientificPrinciple(e.target.value)}
                placeholder="Which physics, chemistry, or biology law makes this work?"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Virtual Lab Verification / Prototype Notes</label>
            <textarea
              rows={2}
              value={virtualPrototypeNotes}
              onChange={(e) => setVirtualPrototypeNotes(e.target.value)}
              placeholder="Note any experiments or calculations you used to test your idea..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-600 block">Optional Prototype Sketch</label>
            <DrawingCanvas value={drawingDataUrl} onChange={setDrawingDataUrl} />
          </div>

          <button
            type="submit"
            className="px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            Complete Innovation Idea
          </button>
        </form>
      )}

      {/* TAB 3: MY IDEAS & PRIVATE DRAFTS */}
      {activeTab === 'my-ideas' && (
        <div className="space-y-4">
          {myInnovations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
              <Lightbulb className="w-8 h-8 text-blue-700 mx-auto" />
              <p className="text-base font-medium text-slate-900">{t.emptyStates.noInnovations}</p>
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold"
              >
                Open Innovation Builder
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myInnovations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-600">
                        {item.category} · Status:{' '}
                        <span className="text-blue-700 font-semibold">
                          {item.status === 'draft'
                            ? 'Private Draft'
                            : item.status === 'pending_approval'
                              ? 'Pending Teacher Approval'
                              : item.status === 'approved'
                                ? 'Approved in Global Showcase'
                                : 'Needs Revision'}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mt-0.5">{item.title}</h3>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => deleteMyInnovation(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">{item.problemSolved}</p>
                  {item.teacherFeedback && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900">
                      <strong>Teacher Feedback:</strong> {item.teacherFeedback}
                    </div>
                  )}

                  {item.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() =>
                        saveInnovation({
                          ...item,
                          status: 'pending_approval',
                          updatedAt: new Date().toISOString(),
                        })
                      }
                      className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Request Showcase Approval
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SAVED INSPIRATIONS */}
      {activeTab === 'saved' && (
        <div>
          {savedItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              No saved inspirations yet. Bookmark ideas from the Published Showcase tab to keep them here.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {savedItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
                  <div className="text-xs text-slate-500">{item.category} · {item.anonymousAlias}</div>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600">{item.scientificPrinciple}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explicit Showcase Consent Modal */}
      <Modal
        open={Boolean(pendingIdea)}
        onClose={() => finalizeIdea('dismiss')}
        title="Share Your Innovation?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-900 leading-relaxed">
            Your idea could inspire students around the world. Would you like to showcase it?
          </p>
          <p className="text-xs text-slate-600">
            Your real name, email, and school are never displayed. Public showcase submissions require teacher or guardian approval before appearing globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => finalizeIdea('showcase')}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800"
            >
              Showcase My Idea
            </button>
            <button
              type="button"
              onClick={() => finalizeIdea('private')}
              className="flex-1 py-2.5 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold hover:border-blue-400"
            >
              Save Privately
            </button>
            <button
              type="button"
              onClick={() => finalizeIdea('dismiss')}
              className="py-2.5 px-4 rounded-lg text-slate-600 text-xs hover:text-slate-900"
            >
              Not Now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
