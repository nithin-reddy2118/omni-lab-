import type { LanguageCode } from '../types/science';

export interface TranslationBundle {
  appName: string;
  tagline: string;
  secondaryTagline: string;
  nav: {
    home: string;
    dashboard: string;
    subjects: string;
    labTutor: string;
    inventoryExplorer: string;
    researchNotebook: string;
    innovationSuite: string;
    explorer: string;
    smartLearning: string;
    algorithmExplorer: string;
    creator: string;
    virtualLab: string;
    whatIf: string;
    detective: string;
    safety: string;
    trustCentre: string;
    innovationHub: string;
    discoveries: string;
    challenges: string;
    myLearning: string;
    achievements: string;
    teacherMode: string;
    settings: string;
  };
  actions: {
    startExploring: string;
    exploreExperiments: string;
    discoverInnovations: string;
    runExperiment: string;
    reset: string;
    addTrial: string;
    exportCsv: string;
    exportPdf: string;
    saveReport: string;
    close: string;
  };
  tabs: {
    experiment: string;
    graphs: string;
    trials: string;
    report: string;
  };
  emptyStates: {
    noTrials: string;
    noInnovations: string;
    noReports: string;
  };
}

const EN: TranslationBundle = {
  appName: 'OMNILAB',
  tagline: 'WHERE CURIOSITY BECOMES DISCOVERY',
  secondaryTagline:
    'An AI-powered virtual science campus where every student can learn, experiment, investigate and innovate — from their first school laboratory to advanced scientific research.',
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    labTutor: 'AI Lab Tutor',
    inventoryExplorer: 'Equipment & Chemicals',
    researchNotebook: 'Research Notebook',
    innovationSuite: 'Innovation Lab Suite',
    explorer: 'Science Explorer',
    smartLearning: 'Smart Video Studio',
    algorithmExplorer: 'Algorithm Explorer',
    creator: 'Experiment Creator',
    virtualLab: 'Virtual Lab',
    whatIf: 'What If Studio',
    detective: 'Science Detective',
    safety: 'Safety & Help',
    trustCentre: 'Scientific Trust Centre',
    innovationHub: 'Discovery Museum',
    discoveries: 'World Discoveries',
    challenges: 'Science Challenges',
    myLearning: 'My Experiments',
    achievements: 'Lab Passport',
    teacherMode: 'Teacher Mode',
    settings: 'Settings',
  },
  actions: {
    startExploring: 'Start Exploring',
    exploreExperiments: 'Explore Experiments',
    discoverInnovations: 'Discover Innovations',
    runExperiment: 'Run Experiment',
    reset: 'Reset',
    addTrial: 'Add Trial',
    exportCsv: 'Export CSV',
    exportPdf: 'Download PDF Report',
    saveReport: 'Save Report',
    close: 'Close',
  },
  tabs: {
    experiment: 'Experiment',
    graphs: 'Graphs',
    trials: 'Trials',
    report: 'Report & Export',
  },
  emptyStates: {
    noTrials: 'No trials yet. Run your first trial to see your results.',
    noInnovations: 'No saved innovations yet. Start creating your first idea.',
    noReports: 'No reports yet. Complete an experiment to generate a report.',
  },
};

const KN: TranslationBundle = {
  appName: 'OMNILAB',
  tagline: 'WHERE CURIOSITY BECOMES DISCOVERY · ಕುತೂಹಲವೇ ಆವಿಷ್ಕಾರವಾಗುವ ತಾಣ',
  secondaryTagline:
    'ಶಾಲಾ ಪ್ರಯೋಗಾಲಯದಿಂದ ಸುಧಾರಿತ ವೈಜ್ಞಾನಿಕ ಸಂಶೋಧನೆಯವರೆಗೆ ಪ್ರತಿಯೊಬ್ಬ ವಿದ್ಯಾರ್ಥಿಯೂ ಕಲಿಯಲು, ಪ್ರಯೋಗಿಸಲು ಮತ್ತು ಆವಿಷ್ಕರಿಸಲು AI-ಆಧಾರಿತ ವರ್ಚುವಲ್ ವಿಜ್ಞಾನ ಕ್ಯಾಂಪಸ್.',
  nav: {
    home: 'ಮುಖಪುಟ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    subjects: 'ವಿಷಯಗಳು',
    labTutor: 'AI ಲ್ಯಾಬ್ ಶಿಕ್ಷಕ',
    inventoryExplorer: 'ಉಪಕರಣಗಳು ಮತ್ತು ರಾಸಾಯನಿಕಗಳು',
    researchNotebook: 'ಸಂಶೋಧನಾ ನೋಟ್‌ಬುಕ್',
    innovationSuite: 'ನಾವೀನ್ಯತೆ ಲ್ಯಾಬ್',
    explorer: 'ವಿಜ್ಞಾನ ಅನ್ವೇಷಕ',
    smartLearning: 'ಸ್ಮಾರ್ಟ್ ವಿಡಿಯೋ ಸ್ಟುಡಿಯೋ',
    algorithmExplorer: 'ಅಲ್ಗಾರಿದಮ್ ಅನ್ವೇಷಕ',
    creator: 'ಪ್ರಯೋಗ ರಚನೆಕಾರ',
    virtualLab: 'ವರ್ಚುವಲ್ ಪ್ರಯೋಗಾಲಯ',
    whatIf: 'ವಾಟ್ ಇಫ್ ಸ್ಟುಡಿಯೋ',
    detective: 'ವಿಜ್ಞಾನ ಪತ್ತೇದಾರ',
    safety: 'ಸುರಕ್ಷತೆ ಮತ್ತು ಸಹಾಯ',
    trustCentre: 'ವೈಜ್ಞಾನಿಕ ವಿಶ್ವಾಸ ಕೇಂದ್ರ',
    innovationHub: 'ಆವಿಷ್ಕಾರ ವಸ್ತುಸಂಗ್ರಹಾಲಯ',
    discoveries: 'ವಿಶ್ವ ಆವಿಷ್ಕಾರಗಳು',
    challenges: 'ವಿಜ್ಞಾನ ಸವಾಲುಗಳು',
    myLearning: 'ನನ್ನ ಪ್ರಯೋಗಗಳು',
    achievements: 'ಲ್ಯಾಬ್ ಪಾಸ್‌ಪೋರ್ಟ್',
    teacherMode: 'ಶಿಕ್ಷಕರ ಮೋಡ್',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
  },
  actions: {
    startExploring: 'ಅನ್ವೇಷಣೆ ಪ್ರಾರಂಭಿಸಿ',
    exploreExperiments: 'ಪ್ರಯೋಗಗಳನ್ನು ನೋಡಿ',
    discoverInnovations: 'ನಾವೀನ್ಯತೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    runExperiment: 'ಪ್ರಯೋಗ ನಡೆಸಿ',
    reset: 'ಮರುಹೊಂದಿಸಿ',
    addTrial: 'ಟ್ರಯಲ್ ಸೇರಿಸಿ',
    exportCsv: 'CSV ರಫ್ತು',
    exportPdf: 'PDF ವರದಿ ಡೌನ್‌ಲೋಡ್',
    saveReport: 'ವರದಿ ಉಳಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
  },
  tabs: {
    experiment: 'ಪ್ರಯೋಗ',
    graphs: 'ಗ್ರಾಫ್‌ಗಳು',
    trials: 'ಟ್ರಯಲ್‌ಗಳು',
    report: 'ವರದಿ ಮತ್ತು ರಫ್ತು',
  },
  emptyStates: {
    noTrials: 'ಇನ್ನೂ ಯಾವುದೇ ಟ್ರಯಲ್‌ಗಳಿಲ್ಲ. ನಿಮ್ಮ ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಲು ಮೊದಲ ಟ್ರಯಲ್ ನಡೆಸಿ.',
    noInnovations: 'ಇನ್ನೂ ಯಾವುದೇ ನಾವೀನ್ಯತೆಗಳನ್ನು ಉಳಿಸಲಾಗಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಕಲ್ಪನೆಯನ್ನು ರಚಿಸಲು ಪ್ರಾರಂಭಿಸಿ.',
    noReports: 'ಇನ್ನೂ ಯಾವುದೇ ವರದಿಗಳಿಲ್ಲ. ವರದಿ ರಚಿಸಲು ಪ್ರಯೋಗವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.',
  },
};

const HI: TranslationBundle = {
  appName: 'OMNILAB',
  tagline: 'WHERE CURIOSITY BECOMES DISCOVERY · जहाँ जिज्ञासा आविष्कार बनती है',
  secondaryTagline:
    'एक AI-सक्षम वर्चुअल विज्ञान परिसर जहाँ हर छात्र स्कूल प्रयोगशाला से उन्नत वैज्ञानिक अनुसंधान तक सीख, प्रयोग और नवाचार कर सकता है।',
  nav: {
    home: 'होम',
    dashboard: 'डैशबोर्ड',
    subjects: 'विषय',
    labTutor: 'AI लैब ट्यूटर',
    inventoryExplorer: 'उपकरण और रसायन',
    researchNotebook: 'रिसर्च नोटबुक',
    innovationSuite: 'नवाचार प्रयोगशाला',
    explorer: 'विज्ञान एक्सप्लोरर',
    smartLearning: 'स्मार्ट वीडियो स्टूडियो',
    algorithmExplorer: 'एल्गोरिथम एक्सप्लोरर',
    creator: 'प्रयोग निर्माता',
    virtualLab: 'वर्चुअल लैब',
    whatIf: 'व्हाट इफ स्टूडियो',
    detective: 'साइंस डिटेक्टिव',
    safety: 'सुरक्षा और सहायता',
    trustCentre: 'वैज्ञानिक ट्रस्ट केंद्र',
    innovationHub: 'आविष्कार संग्रहालय',
    discoveries: 'विश्व खोजें',
    challenges: 'विज्ञान चुनौतियाँ',
    myLearning: 'मेरे प्रयोग',
    achievements: 'लैब पासपोर्ट',
    teacherMode: 'शिक्षक मोड',
    settings: 'सेटिंग्स',
  },
  actions: {
    startExploring: 'खोज शुरू करें',
    exploreExperiments: 'प्रयोग देखें',
    discoverInnovations: 'नवाचार खोजें',
    runExperiment: 'प्रयोग चलाएं',
    reset: 'रीसेट करें',
    addTrial: 'ट्रायल जोड़ें',
    exportCsv: 'CSV निर्यात',
    exportPdf: 'PDF रिपोर्ट डाउनलोड',
    saveReport: 'रिपोर्ट सहेजें',
    close: 'बंद करें',
  },
  tabs: {
    experiment: 'प्रयोग',
    graphs: 'ग्राफ़',
    trials: 'ट्रायल्स',
    report: 'रिपोर्ट और निर्यात',
  },
  emptyStates: {
    noTrials: 'अभी तक कोई ट्रायल नहीं। अपने परिणाम देखने के लिए पहला ट्रायल चलाएं।',
    noInnovations: 'अभी तक कोई सहेजा गया नवाचार नहीं। अपना पहला विचार बनाना शुरू करें।',
    noReports: 'अभी तक कोई रिपोर्ट नहीं। रिपोर्ट बनाने के लिए एक प्रयोग पूरा करें।',
  },
};

const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: EN,
  kn: KN,
  hi: HI,
};

export function getTranslations(lang: LanguageCode): TranslationBundle {
  return TRANSLATIONS[lang] ?? EN;
}
