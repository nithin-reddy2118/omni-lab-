/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { LabProvider, useLab } from './context/LabContext';
import { TopHeader } from './components/layout/TopHeader';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { DivisionDashboardPage } from './pages/DivisionDashboardPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { LabTutorPage } from './pages/LabTutorPage';
import { InventoryExplorerPage } from './pages/InventoryExplorerPage';
import { ResearchNotebookPage } from './pages/ResearchNotebookPage';
import { InnovationSuitePage } from './pages/InnovationSuitePage';
import { DashboardPage } from './pages/DashboardPage';
import { ScienceExplorerPage } from './pages/ScienceExplorerPage';
import { SmartLearningPage } from './pages/SmartLearningPage';
import { ExperimentCreatorPage } from './pages/ExperimentCreatorPage';
import { VirtualLabPage } from './pages/VirtualLabPage';
import { MyPersonalLabPage } from './pages/MyPersonalLabPage';
import { AlgorithmExplorerPage } from './pages/AlgorithmExplorerPage';
import { WhatIfStudioPage } from './pages/WhatIfStudioPage';
import { ScienceDetectivePage } from './pages/ScienceDetectivePage';
import { SafetyGuardianPage } from './pages/SafetyGuardianPage';
import { TrustCentrePage } from './pages/TrustCentrePage';
import { InnovationHubPage } from './pages/InnovationHubPage';
import { WorldDiscoveriesPage } from './pages/WorldDiscoveriesPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { MyLearningPage } from './pages/MyLearningPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { TeacherModePage } from './pages/TeacherModePage';
import { SettingsPage } from './pages/SettingsPage';

function ActivePageView() {
  const { activePage } = useLab();

  switch (activePage) {
    case 'home':
      return <HomePage />;
    case 'division-home':
      return <DivisionDashboardPage />;
    case 'subjects':
      return <SubjectsPage />;
    case 'lab-tutor':
      return <LabTutorPage />;
    case 'inventory-explorer':
      return <InventoryExplorerPage />;
    case 'research-notebook':
      return <ResearchNotebookPage />;
    case 'innovation-suite':
      return <InnovationSuitePage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'explorer':
      return <ScienceExplorerPage />;
    case 'smart-learning':
      return <SmartLearningPage />;
    case 'creator':
      return <ExperimentCreatorPage />;
    case 'virtual-lab':
      return <VirtualLabPage />;
    case 'personal-lab':
      return <MyPersonalLabPage />;
    case 'algorithm-explorer':
      return <AlgorithmExplorerPage />;
    case 'what-if':
      return <WhatIfStudioPage />;
    case 'detective':
      return <ScienceDetectivePage />;
    case 'safety':
      return <SafetyGuardianPage />;
    case 'trust-centre':
      return <TrustCentrePage />;
    case 'innovation-hub':
      return <InnovationHubPage />;
    case 'discoveries':
      return <WorldDiscoveriesPage />;
    case 'challenges':
      return <ChallengesPage />;
    case 'my-learning':
      return <MyLearningPage />;
    case 'achievements':
      return <AchievementsPage />;
    case 'teacher-mode':
      return <TeacherModePage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}

function AppShell() {
  const { sidebarOpen, navigate } = useLab();

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F172A] flex flex-col">
      <TopHeader />
      <Sidebar />
      <main
        className={`flex-1 transition-[padding] duration-200 ${
          sidebarOpen ? 'lg:pl-72' : ''
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <ActivePageView />
        </div>
      </main>
      <footer
        className={`border-t border-slate-200 bg-white py-6 text-xs text-slate-600 transition-[padding] duration-200 ${
          sidebarOpen ? 'lg:pl-72' : ''
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="font-medium text-slate-700">
            OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY · AI-Powered Virtual Science Campus
          </div>
          <div className="flex flex-wrap gap-5">
            <button type="button" onClick={() => navigate('smart-learning')} className="hover:text-blue-700">
              Smart Video Studio
            </button>
            <button type="button" onClick={() => navigate('algorithm-explorer')} className="hover:text-blue-700">
              Algorithm Explorer
            </button>
            <button type="button" onClick={() => navigate('trust-centre')} className="hover:text-blue-700">
              Scientific Trust Centre
            </button>
            <button type="button" onClick={() => navigate('safety')} className="hover:text-blue-700">
              Safety Guardian
            </button>
            <button type="button" onClick={() => navigate('settings')} className="hover:text-blue-700">
              Accessibility & Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LabProvider>
      <AppShell />
    </LabProvider>
  );
}
