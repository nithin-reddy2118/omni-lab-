import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Type } from '@google/genai';
import { evaluateSafety } from './src/engine/safetyEngine.ts';
import { EXPERIMENTS } from './src/engine/experiments.ts';
import { searchEducationalVideos } from './src/engine/videoSearch.ts';
import { buildLocalExperimentTemplate, matchLocalScienceTopic } from './src/engine/localFallback.ts';
import {
  classifyAiError,
  generateStructuredJson,
  getAiConfigurationSummary,
} from './server/aiService.ts';
import { UCI_DATASETS_CATALOG, metaToLoadedDataset } from './src/data/uciDatasets.ts';
import { ALGORITHM_REGISTRY } from './src/data/algorithmRegistry.ts';
import { parseLocalAlgorithmDescription } from './src/engine/algorithmExecutor.ts';
import {
  LAB_INSTRUMENTS,
  checkInstrumentConnection,
  getRecommendedKitForExperiment,
} from './src/data/labEquipment.ts';
import { getChemicalById } from './src/data/chemicals.ts';
import { CURRICULUM_EXPERIMENT_CATALOG } from './src/data/experimentCatalog.ts';
import { executeScientificExperiment } from './src/engine/executionEngine.ts';
import { buildDiscoveryInvestigation } from './src/engine/discoveryEngine.ts';

import {
  appendRenderFrames,
  finalizeRenderJob,
  generateSmartLessonService,
  getEnvironmentCapabilities,
  getRenderedVideoFile,
  initRenderJob,
  synthesizeSceneSpeech,
} from './server/smartLearningService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use('/api/smart-learning/render', express.json({ limit: '25mb' }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    const ai = getAiConfigurationSummary();
    res.json({
      status: 'ok',
      aiConfigured: ai.configured,
      primaryModel: ai.primaryModel,
      fallbackModels: ai.fallbackModels,
      persistenceMode: 'browser-local-offline-ready',
    });
  });

  // 1. Universal Science Explorer (with safe fallback video + experiment matching on 503)
  app.post('/api/ai/explorer', async (req, res) => {
    const question = String(req.body?.question ?? '').trim();
    const preferredSubject = String(req.body?.subject ?? 'Auto-detect').trim();
    const language = String(req.body?.language ?? 'en').trim();

    if (!question) {
      return res.status(400).json({ error: 'Please enter a scientific question.' });
    }

    const safety = evaluateSafety(question);
    if (safety.level === 'RED') {
      return res.status(200).json({
        blockedBySafety: true,
        safety,
      });
    }

    const localMatch = matchLocalScienceTopic(question);

    try {
      const experimentCatalog = EXPERIMENTS.map((e) => `${e.id}: ${e.title} (${e.formula})`).join('\n');
      const langInstruction =
        language === 'kn'
          ? 'Write explanations in clear, student-friendly Kannada (ಕನ್ನಡ) with standard scientific terms.'
          : language === 'hi'
            ? 'Write explanations in clear, student-friendly Hindi (हिन्दी) with standard scientific terms.'
            : 'Write explanations in clear, simple English suitable for curious students.';

      const { data: parsed, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
        contents: `Student question: "${question}"\nPreferred subject filter: ${preferredSubject}\n\nAvailable validated Virtual Lab experiments (ONLY suggest one of these exact IDs if genuinely relevant, otherwise null):\n${experimentCatalog}`,
        systemInstruction: `You are the Universal Science Explorer for "OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY". ${langInstruction} Write clear explanations appropriate for Classes 6-10. Cover subject-specific principles (Chemistry: substances/reactions/pressure/temp/pH/molecules; Physics: forces/motion/energy/electricity/light/sound/pressure; Biology: cells/organisms/photosynthesis/respiration/ecosystems; Astronomy: planets/stars/gravity/orbits/space; Engineering: machines/mechanisms/structures/circuits; Environmental Science: water/climate/pollution/ecosystems/sustainability). NEVER invent video URLs or claim to have analyzed video frames directly—frame the videoBreakdown around the scientific phenomenon demonstrated. Distinguish classroom demonstrations from safe student activities. Choose visualFallbackType strictly from: "boiling", "pendulum", "photosynthesis", "circuit", "rainbow", "rocket", "microscope", "magnet", "heat-shield", "cooling", "general".`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            conceptExplanation: { type: Type.STRING },
            scientificPrinciples: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedExperimentId: { type: Type.STRING, nullable: true },
            suggestedExperimentReason: { type: Type.STRING },
            suggestedCreatorPrompt: { type: Type.STRING, nullable: true },
            variables: {
              type: Type.OBJECT,
              properties: {
                independent: { type: Type.ARRAY, items: { type: Type.STRING } },
                dependent: { type: Type.ARRAY, items: { type: Type.STRING } },
                controlled: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['independent', 'dependent', 'controlled'],
            },
            formulaHighlight: { type: Type.STRING },
            graphSuggestion: { type: Type.STRING },
            realWorldApplications: { type: Type.ARRAY, items: { type: Type.STRING } },
            uncertaintyAndLimitations: { type: Type.STRING },
            verifiableSources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                },
                required: ['title', 'url'],
              },
            },
            videoSearchKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                '2-3 concise English search keywords for Wikimedia Commons or NASA video libraries, e.g. ["boiling water bubbles", "vapor pressure"].',
            },
            visualFallbackType: { type: Type.STRING },
            videoBreakdown: {
              type: Type.OBJECT,
              properties: {
                whatIsHappening: { type: Type.STRING },
                conceptDemonstrated: { type: Type.STRING },
                whatToObserve: { type: Type.ARRAY, items: { type: Type.STRING } },
                whyItHappens: { type: Type.STRING },
                scientificLaws: { type: Type.ARRAY, items: { type: Type.STRING } },
                realWorldApplications: { type: Type.ARRAY, items: { type: Type.STRING } },
                demonstrationLimitations: { type: Type.STRING },
                classroomSafetyDistinction: { type: Type.STRING },
              },
              required: [
                'whatIsHappening',
                'conceptDemonstrated',
                'whatToObserve',
                'whyItHappens',
                'scientificLaws',
                'realWorldApplications',
                'demonstrationLimitations',
                'classroomSafetyDistinction',
              ],
            },
            followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'subject',
            'conceptExplanation',
            'scientificPrinciples',
            'suggestedExperimentReason',
            'variables',
            'formulaHighlight',
            'graphSuggestion',
            'realWorldApplications',
            'uncertaintyAndLimitations',
            'verifiableSources',
            'videoSearchKeywords',
            'visualFallbackType',
            'videoBreakdown',
            'followUpQuestions',
          ],
        },
      });

      const validIds = new Set(EXPERIMENTS.map((e) => e.id));
      const rawSuggestedId =
        typeof parsed.suggestedExperimentId === 'string' ? parsed.suggestedExperimentId : null;
      const matchedId =
        rawSuggestedId && validIds.has(rawSuggestedId)
          ? rawSuggestedId
          : localMatch.matchedExperimentId;

      const allowedFallbacks = new Set([
        'boiling',
        'pendulum',
        'photosynthesis',
        'circuit',
        'rainbow',
        'rocket',
        'microscope',
        'magnet',
        'heat-shield',
        'cooling',
        'general',
      ]);
      const rawFallback =
        typeof parsed.visualFallbackType === 'string' ? parsed.visualFallbackType : '';
      const fallbackType = allowedFallbacks.has(rawFallback)
        ? rawFallback
        : localMatch.visualFallbackType;

      const keywords = Array.isArray(parsed.videoSearchKeywords)
        ? parsed.videoSearchKeywords.map(String)
        : localMatch.videoKeywords;

      let videos = await searchEducationalVideos({
        keywords,
        question,
        subject: String(parsed.subject || preferredSubject),
      });

      if (videos.length === 0 && localMatch.videoKeywords.length > 0) {
        videos = await searchEducationalVideos({
          keywords: localMatch.videoKeywords,
          question,
          subject: String(parsed.subject || preferredSubject),
        });
      }

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        videos,
        result: {
          ...parsed,
          suggestedExperimentId: matchedId,
          visualFallbackType: fallbackType,
          safetyClassification: safety.level,
          safetyNote: safety.summary,
        },
      });
    } catch (err) {
      const info = classifyAiError(err);
      // Even when Gemini AI fails (e.g. 503), still return verified educational videos + local experiment match so student is not blocked!
      const fallbackVideos = await searchEducationalVideos({
        keywords: localMatch.videoKeywords,
        question,
        subject: preferredSubject,
      }).catch(() => []);

      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
        safety,
        fallback: {
          matchedExperimentId: localMatch.matchedExperimentId,
          department: localMatch.department,
          visualFallbackType: localMatch.visualFallbackType,
          reason: localMatch.reason,
          videos: fallbackVideos,
        },
      });
    }
  });

  // 1b. Find Another Relevant Educational Video
  app.post('/api/videos/search', async (req, res) => {
    try {
      const question = String(req.body?.question ?? '').trim();
      const keywords = Array.isArray(req.body?.keywords) ? req.body.keywords.map(String) : [];
      const subject = String(req.body?.subject ?? '').trim();
      const excludeIds = Array.isArray(req.body?.excludeIds) ? req.body.excludeIds.map(String) : [];

      if (!question && keywords.length === 0) {
        return res.status(400).json({ error: 'Search question or keywords are required.' });
      }

      const safety = evaluateSafety(question || keywords.join(' '));
      if (safety.level === 'RED') {
        return res.status(200).json({ blockedBySafety: true, safety, videos: [] });
      }

      const videos = await searchEducationalVideos({
        keywords,
        question,
        subject,
        excludeIds,
      });

      return res.json({ blockedBySafety: false, videos });
    } catch (err) {
      return res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to reach educational video provider.',
      });
    }
  });

  // 2. AI Experiment Creator (Structured definition + safe local template fallback metadata on AI error)
  app.post('/api/ai/create-experiment', async (req, res) => {
    const prompt = String(req.body?.prompt ?? '').trim();
    const language = String(req.body?.language ?? 'en').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Please describe the experiment you want to design.' });
    }

    const safety = evaluateSafety(prompt);
    if (safety.level === 'RED') {
      return res.status(200).json({
        blockedBySafety: true,
        safety,
      });
    }

    const localMatch = matchLocalScienceTopic(prompt);

    try {
      const langInstruction =
        language === 'kn'
          ? 'Use simple, accurate Kannada for descriptive text.'
          : language === 'hi'
            ? 'Use simple, accurate Hindi for descriptive text.'
            : 'Use clear, simple English.';

      const { data: parsed, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
        contents: `Design a safe, structured educational science experiment for a student based on: "${prompt}"`,
        systemInstruction: `You design structured educational science experiments. ${langInstruction} NEVER output executable code. Choose calculationTemplate strictly from: "linear_ratio", "inverse_proportion", "quadratic_growth", "exponential_decay", "logarithmic_scale". Safety classification cannot be safer than "${safety.level}".`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            learningObjective: { type: Type.STRING },
            scientificPrinciple: { type: Type.STRING },
            hypothesis: { type: Type.STRING },
            independentVariable: { type: Type.STRING },
            dependentVariable: { type: Type.STRING },
            controlledVariables: { type: Type.ARRAY, items: { type: Type.STRING } },
            formula: { type: Type.STRING },
            units: { type: Type.STRING },
            parameterRanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  symbol: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER },
                  defaultValue: { type: Type.NUMBER },
                },
                required: ['name', 'symbol', 'unit', 'min', 'max', 'defaultValue'],
              },
            },
            procedure: { type: Type.ARRAY, items: { type: Type.STRING } },
            predictionPrompt: { type: Type.STRING },
            expectedResult: { type: Type.STRING },
            graphRecommendation: { type: Type.STRING },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyGuidance: { type: Type.STRING },
            calculationTemplate: { type: Type.STRING },
          },
          required: [
            'title',
            'subject',
            'learningObjective',
            'scientificPrinciple',
            'hypothesis',
            'independentVariable',
            'dependentVariable',
            'controlledVariables',
            'formula',
            'units',
            'parameterRanges',
            'procedure',
            'predictionPrompt',
            'expectedResult',
            'graphRecommendation',
            'assumptions',
            'limitations',
            'safetyGuidance',
            'calculationTemplate',
          ],
        },
      });

      const allowedTemplates = new Set([
        'linear_ratio',
        'inverse_proportion',
        'quadratic_growth',
        'exponential_decay',
        'logarithmic_scale',
      ]);
      const rawTemplate = String(parsed.calculationTemplate || '');
      const template = allowedTemplates.has(rawTemplate) ? rawTemplate : 'linear_ratio';
      const localTemplate = buildLocalExperimentTemplate(prompt);

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        experiment: {
          ...parsed,
          department: localMatch.department,
          recommendedEquipmentIds: localTemplate.recommendedEquipmentIds,
          recommendedChemicalIds: localTemplate.recommendedChemicalIds,
          roomOverviewNote: localMatch.reason,
          matchedValidatedModelId: localMatch.matchedExperimentId,
          hasValidatedModel: Boolean(localMatch.matchedExperimentId),
          sourceMode: 'ai',
          calculationTemplate: template,
          safetyClassification: safety.level,
        },
      });
    } catch (err) {
      const info = classifyAiError(err);
      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
        safety,
        fallbackTemplate: buildLocalExperimentTemplate(prompt),
      });
    }
  });

  // 3. Science Detective AI Tutor
  app.post('/api/ai/detective', async (req, res) => {
    const studentMessage = String(req.body?.message ?? '').trim();
    const experimentContext = req.body?.experimentContext ?? {};
    const language = String(req.body?.language ?? 'en').trim();

    if (!studentMessage) {
      return res.status(400).json({ error: 'Please enter your observation, prediction, or question.' });
    }

    const safety = evaluateSafety(studentMessage);
    if (safety.level === 'RED') {
      return res.status(200).json({ blockedBySafety: true, safety });
    }

    try {
      const langInstruction =
        language === 'kn'
          ? 'Respond in warm, simple Kannada.'
          : language === 'hi'
            ? 'Respond in warm, simple Hindi.'
            : 'Respond in warm, simple English.';

      const { data: tutorResponse, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
        contents: `Active Experiment Context:\n${JSON.stringify(experimentContext, null, 2)}\n\nStudent says: "${studentMessage}"`,
        systemInstruction: `You are Science Detective, a friendly Socratic STEM tutor. ${langInstruction} Use the actual calculated outputs provided in the context. Identify any misconceptions gently, use an everyday analogy, give a helpful hint without immediately giving away everything, and ask one guiding question that encourages running another trial.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observation: { type: Type.STRING },
            misconceptionCheck: { type: Type.STRING },
            everydayExample: { type: Type.STRING },
            hint: { type: Type.STRING },
            guidingQuestion: { type: Type.STRING },
            suggestedNextTrial: { type: Type.STRING },
          },
          required: [
            'observation',
            'misconceptionCheck',
            'everydayExample',
            'hint',
            'guidingQuestion',
            'suggestedNextTrial',
          ],
        },
      });

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        tutorResponse,
      });
    } catch (err) {
      const info = classifyAiError(err);
      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
        safety,
      });
    }
  });

  // 3b. Division-Adapted AI Lab Tutor (School 5-10 / Higher Ed / Advanced Research)
  app.post('/api/ai/division-tutor', async (req, res) => {
    const division = String(req.body?.division ?? 'school').trim();
    const levelLabel = String(req.body?.levelLabel ?? 'Class 8').trim();
    const subject = String(req.body?.subject ?? 'Chemistry').trim();
    const labId = String(req.body?.labId ?? 'chemistry').trim();
    const question = String(req.body?.question ?? '').trim();
    const currentStage = String(req.body?.currentStage ?? 'Concept & Equipment').trim();
    const language = String(req.body?.language ?? 'en').trim();
    const workbenchSummary = String(req.body?.workbenchSummary ?? '').trim();

    if (!question) {
      return res.status(400).json({ error: 'Please enter a question or topic for the AI Lab Tutor.' });
    }

    const safety = evaluateSafety(question);
    if (safety.level === 'RED') {
      return res.status(200).json({ blockedBySafety: true, safety });
    }

    try {
      const divisionGuidance =
        division === 'school'
          ? `Tailor depth strictly to school student level (${levelLabel}): everyday language, intuition before symbols, visual analogies, safe classroom habits.`
          : division === 'higher'
            ? `Tailor depth to Higher Education (${levelLabel}): formal equations, SI units, experimental uncertainties ±Δ, and variable relationships.`
            : `Tailor depth to Advanced Research (${levelLabel}): analytical instrumentation principles, kinetic/thermodynamic assumptions, error bounds, and clear distinction between educational simulation and empirical wet-lab validation.`;

      const langInstruction =
        language === 'kn'
          ? 'Respond in clear Kannada (ಕನ್ನಡ) with standard SI scientific units.'
          : language === 'hi'
            ? 'Respond in clear Hindi (हिन्दी) with standard SI scientific units.'
            : 'Respond in clear, precise English.';

      const { data: guide, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
        contents: `Division: ${division}\nLevel/Track: ${levelLabel}\nSubject: ${subject}\nLab Wing: ${labId}\nCurrent Tutor Stage: ${currentStage}\nWorkbench Context: ${workbenchSummary || 'Standard bench setup'}\nLearner Prompt: "${question}"`,
        systemInstruction: `You are OmniLab's Personal AI Lab Tutor. ${divisionGuidance} ${langInstruction} Never fabricate chemical reactions or unsafe synthesis instructions. Clearly distinguish simulated educational behavior from real wet-lab uncertainty.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            welcomeHeadline: { type: Type.STRING },
            conceptExplanation: { type: Type.STRING },
            equationAndUnits: { type: Type.STRING },
            equipmentAndSetup: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyCheck: { type: Type.STRING },
            predictionChallenge: { type: Type.STRING },
            commonMisconceptionHint: { type: Type.STRING },
            nextInvestigationStep: { type: Type.STRING },
          },
          required: [
            'welcomeHeadline',
            'conceptExplanation',
            'equationAndUnits',
            'equipmentAndSetup',
            'safetyCheck',
            'predictionChallenge',
            'commonMisconceptionHint',
            'nextInvestigationStep',
          ],
        },
      });

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        guide,
      });
    } catch (err) {
      const info = classifyAiError(err);
      const localMatch = matchLocalScienceTopic(question);
      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
        safety,
        fallbackGuide: {
          welcomeHeadline: `Deterministic Offline Tutor (${levelLabel})`,
          conceptExplanation: `${localMatch.reason}. (${info.userMessage})`,
          equationAndUnits: 'Check validated model card inside Virtual Lab for exact SI equation.',
          equipmentAndSetup: [
            `Enter the ${localMatch.department} wing in Virtual Laboratory`,
            'Click "Load Recommended Kit" to arrange validated instruments cleanly',
          ],
          safetyCheck: safety.summary,
          predictionChallenge: 'Before clicking Start Experiment, predict whether increasing your independent variable raises or lowers the measured output.',
          commonMisconceptionHint: 'Double-check units (e.g., kPa vs atm, °C vs K, mL vs L) and keep control variables fixed.',
          nextInvestigationStep: 'Run Trial 1 and Trial 2 in Virtual Lab and compare your graph.',
        },
      });
    }
  });

  // 3c. AI Equipment-to-Experiment Discovery (Workbench Inspection + Idea Proposal)
  app.post('/api/ai/workbench-discover', async (req, res) => {
    const instrumentIds: string[] = Array.isArray(req.body?.instrumentIds)
      ? req.body.instrumentIds.map(String)
      : [];
    const chemicalIds: string[] = Array.isArray(req.body?.chemicalIds)
      ? req.body.chemicalIds.map(String)
      : [];
    const division = String(req.body?.division ?? 'school').trim();
    const levelLabel = String(req.body?.levelLabel ?? 'Class 8').trim();
    const department = String(req.body?.department ?? 'chemistry').trim();
    const customIdea = String(req.body?.customIdea ?? '').trim();
    const language = String(req.body?.language ?? 'en').trim();

    const safetyInput = [
      customIdea,
      ...instrumentIds.map((id) => LAB_INSTRUMENTS.find((i) => i.id === id)?.name || id),
      ...chemicalIds.map((id) => getChemicalById(id)?.name || id),
    ]
      .filter(Boolean)
      .join(' ');

    const safety = evaluateSafety(safetyInput || department);
    if (safety.level === 'RED') {
      return res.status(200).json({ blockedBySafety: true, safety });
    }

    const placedInstruments = instrumentIds
      .map((id) => LAB_INSTRUMENTS.find((i) => i.id === id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const placedChemicals = chemicalIds
      .map((id) => getChemicalById(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    // Check pairwise compatibility warnings on the bench
    const compatibilityIssues: string[] = [];
    for (let i = 0; i < placedInstruments.length; i++) {
      for (let j = i + 1; j < placedInstruments.length; j++) {
        const chk = checkInstrumentConnection(placedInstruments[i], placedInstruments[j]);
        if (!chk.valid && /Incompatible|Isolated|never/i.test(chk.note)) {
          compatibilityIssues.push(chk.note);
        }
      }
    }

    // Score every validated experiment model against bench equipment + chemicals
    const uniqueInstSet = new Set(instrumentIds);
    const uniqueChemSet = new Set(chemicalIds);

    const matchedExperiments = EXPERIMENTS.map((exp) => {
      const kit = getRecommendedKitForExperiment(exp.id);
      const reqInsts = kit.instrumentIds;
      const reqChems = kit.chemicalIds ?? [];

      const matchedEquip = reqInsts.filter((id) => uniqueInstSet.has(id));
      const missingEquip = reqInsts
        .filter((id) => !uniqueInstSet.has(id))
        .map((id) => LAB_INSTRUMENTS.find((x) => x.id === id)?.name || id);
      const matchedChems = reqChems.filter((id) => uniqueChemSet.has(id));
      const missingChems = reqChems
        .filter((id) => !uniqueChemSet.has(id))
        .map((id) => getChemicalById(id)?.name || id);

      const totalReq = Math.max(1, reqInsts.length + reqChems.length);
      const totalMatched = matchedEquip.length + matchedChems.length;
      const deptBonus = kit.department === department ? 0.15 : 0;
      const matchRatio = totalMatched / totalReq;
      const score = Number((matchRatio + (totalMatched > 0 ? deptBonus : 0)).toFixed(2));

      return {
        experimentId: exp.id,
        title: exp.title,
        subject: exp.subject,
        formula: exp.formula,
        department: kit.department,
        matchScore: score,
        matchedCount: totalMatched,
        totalRequired: totalReq,
        matchedEquipmentNames: matchedEquip.map((id) => LAB_INSTRUMENTS.find((x) => x.id === id)?.name || id),
        missingEquipmentNames: [...missingEquip, ...missingChems],
        isReadyToRun: missingEquip.length === 0 && missingChems.length === 0 && totalMatched > 0,
      };
    })
      .filter((m) => m.matchedCount > 0)
      .sort((a, b) => b.matchScore - a.matchScore || b.matchedCount - a.matchedCount)
      .slice(0, 5);

    const curriculumMatches = CURRICULUM_EXPERIMENT_CATALOG.filter((entry) => {
      const overlap = entry.equipmentIds.filter((id) => uniqueInstSet.has(id)).length;
      return overlap > 0;
    })
      .slice(0, 4)
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        board: entry.board,
        modelId: entry.modelId,
        modelTier: entry.modelTier,
      }));

    const deterministicPrompt =
      'I noticed the materials on your workbench. What would you like to investigate?';

    const aiSummary = getAiConfigurationSummary();
    if (!aiSummary.configured || (placedInstruments.length === 0 && placedChemicals.length === 0 && !customIdea)) {
      return res.json({
        blockedBySafety: false,
        safety,
        promptQuestion: deterministicPrompt,
        compatibilityIssues: Array.from(new Set(compatibilityIssues)),
        matchedExperiments,
        curriculumMatches,
        aiGuidance: {
          headline:
            matchedExperiments.length > 0
              ? `Detected ${matchedExperiments.length} compatible experiment path${matchedExperiments.length > 1 ? 's' : ''} on your bench.`
              : 'Add apparatus or reagents to discover compatible experiments.',
          customIdeaFeedback: customIdea
            ? `Your idea ("${customIdea}") passed Safety Guardian (${safety.level}). Select a matched validated model or open Experiment Creator to formalize hypothesis and variables.`
            : null,
          requiresConfirmation: true,
        },
      });
    }

    try {
      const { data: aiGuidance, modelUsed } = await generateStructuredJson<{
        headline: string;
        suggestedExperiments: { title: string; scientificQuestion: string; linkedModelId: string | null; feasibilityNote: string }[];
        customIdeaFeedback: string | null;
      }>({
        contents: `Division: ${division} (${levelLabel})\nDepartment Wing: ${department}\nPlaced Instruments: ${placedInstruments.map((i) => `${i.id}: ${i.name}`).join(', ') || 'None'}\nPlaced Virtual Chemicals: ${placedChemicals.map((c) => `${c.name} (${c.formula})`).join(', ') || 'None'}\nStudent Original Idea: ${customIdea || 'None entered yet'}\nCandidate Validated Models Matched: ${matchedExperiments.map((m) => `${m.experimentId} (${m.title})`).join('; ') || 'None'}`,
        systemInstruction: `You are OmniLab's Workbench Discovery Assistant (${language === 'kn' ? 'Kannada-friendly' : language === 'hi' ? 'Hindi-friendly' : 'English'}). Analyze ONLY the real instruments/chemicals listed. Never invent simulated measurements or unsafe reactions. Propose 2-3 clear student investigations asking for confirmation before running, and evaluate the student's original idea honestly if provided.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            suggestedExperiments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  scientificQuestion: { type: Type.STRING },
                  linkedModelId: { type: Type.STRING, nullable: true },
                  feasibilityNote: { type: Type.STRING },
                },
                required: ['title', 'scientificQuestion', 'feasibilityNote'],
              },
            },
            customIdeaFeedback: { type: Type.STRING, nullable: true },
          },
          required: ['headline', 'suggestedExperiments'],
        },
      });

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        promptQuestion: deterministicPrompt,
        compatibilityIssues: Array.from(new Set(compatibilityIssues)),
        matchedExperiments,
        curriculumMatches,
        aiGuidance: {
          ...aiGuidance,
          requiresConfirmation: true,
        },
      });
    } catch {
      return res.json({
        blockedBySafety: false,
        safety,
        promptQuestion: deterministicPrompt,
        compatibilityIssues: Array.from(new Set(compatibilityIssues)),
        matchedExperiments,
        curriculumMatches,
        aiGuidance: {
          headline:
            matchedExperiments.length > 0
              ? `Detected ${matchedExperiments.length} compatible validated experiment${matchedExperiments.length > 1 ? 's' : ''} from your apparatus.`
              : 'Arrange instruments cleanly or search the inventory to connect a scientific model.',
          suggestedExperiments: matchedExperiments.slice(0, 3).map((m) => ({
            title: m.title,
            scientificQuestion: `Investigate ${m.formula} using ${m.matchedEquipmentNames.join(', ')}.`,
            linkedModelId: m.experimentId,
            feasibilityNote: m.isReadyToRun
              ? 'All required bench items are present. Confirm to load simulation!'
              : `Missing: ${m.missingEquipmentNames.join(', ')}`,
          })),
          customIdeaFeedback: customIdea
            ? `Safety Guardian verified "${customIdea}" (${safety.level}). You can test matched variables directly or design it in Experiment Creator.`
            : null,
          requiresConfirmation: true,
        },
      });
    }
  });

  // 4. AI Explain This Discovery
  app.post('/api/ai/explain-discovery', async (req, res) => {
    const discovery = req.body?.discovery;
    const level = String(req.body?.level ?? 'Student (Ages 13-17)').trim();
    const language = String(req.body?.language ?? 'en').trim();

    if (!discovery?.title) {
      return res.status(400).json({ error: 'Discovery item is required.' });
    }

    try {
      const langInstruction =
        language === 'kn'
          ? 'Write in simple Kannada.'
          : language === 'hi'
            ? 'Write in simple Hindi.'
            : 'Write in simple English.';

      const { data: explanation, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
        contents: `Explain this verified scientific discovery for audience "${level}" without inventing dates, researchers, or extra claims:\nTitle: ${discovery.title}\nInstitution: ${discovery.institution}\nDate: ${discovery.date}\nSummary: ${discovery.summary}\nConcepts: ${(discovery.concepts || []).join(', ')}`,
        systemInstruction: `You are a clear science communicator. ${langInstruction} Stick strictly to verified science, use an everyday analogy, and mention what remains unknown or challenging.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plainSummary: { type: Type.STRING },
            analogy: { type: Type.STRING },
            howItConnectsToSchoolScience: { type: Type.STRING },
            openQuestions: { type: Type.STRING },
          },
          required: ['plainSummary', 'analogy', 'howItConnectsToSchoolScience', 'openQuestions'],
        },
      });

      return res.json({
        modelUsed,
        explanation,
      });
    } catch (err) {
      const info = classifyAiError(err);
      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
      });
    }
  });

  // 5. UCI Machine Learning Repository Search & Live Proxy
  app.get('/api/uci/search', async (req, res) => {
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const category = String(req.query.category ?? 'All').trim();

    const localMatches = UCI_DATASETS_CATALOG.filter((d) => {
      const catOk =
        category === 'All' ||
        d.category.toLowerCase() === category.toLowerCase() ||
        d.tasks.some((t) => t.toLowerCase() === category.toLowerCase());
      const qOk =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.subjectArea.toLowerCase().includes(q) ||
        d.sampleHeaders.some((h) => h.toLowerCase().includes(q));
      return catOk && qOk;
    });

    // Query live UCI ML Repository API when search keyword is provided
    let liveDirectoryItems: {
      id: number;
      name: string;
      abstract: string;
      task: string;
      subjectArea: string;
      instances: number;
      features: number;
      officialUrl: string;
    }[] = [];
    let uciOnline = false;

    try {
      const uciApiUrl = q
        ? `https://archive.ics.uci.edu/api/datasets/list?search=${encodeURIComponent(q)}&limit=8`
        : 'https://archive.ics.uci.edu/api/datasets/list?limit=8';
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const uciResp = await fetch(uciApiUrl, { signal: ctrl.signal });
      clearTimeout(tid);

      if (uciResp.ok) {
        const json = (await uciResp.json()) as {
          data?: {
            ID?: number;
            Name?: string;
            Abstract?: string;
            Task?: string;
            SubjectArea?: string;
            NumInstances?: number;
            NumFeatures?: number;
          }[];
        };
        if (Array.isArray(json?.data)) {
          uciOnline = true;
          liveDirectoryItems = json.data
            .filter((item) => item.ID && item.Name)
            .slice(0, 8)
            .map((item) => ({
              id: Number(item.ID),
              name: String(item.Name),
              abstract: String(item.Abstract ?? ''),
              task: String(item.Task ?? 'Tabular ML'),
              subjectArea: String(item.SubjectArea ?? 'General'),
              instances: Number(item.NumInstances ?? 0),
              features: Number(item.NumFeatures ?? 0),
              officialUrl: `https://archive.ics.uci.edu/dataset/${item.ID}`,
            }));
        }
      }
    } catch {
      uciOnline = false;
    }

    return res.json({
      uciOnline,
      datasets: localMatches,
      liveDirectoryItems,
    });
  });

  app.get('/api/uci/dataset/:id', async (req, res) => {
    const idNum = Number(req.params.id);
    const meta = UCI_DATASETS_CATALOG.find((d) => d.id === idNum);
    if (!meta) {
      return res.status(404).json({
        error: `Dataset #${idNum} is not in our verified local loader catalog. Visit https://archive.ics.uci.edu/dataset/${idNum} directly to inspect and export its CSV for upload.`,
      });
    }

    if (!meta.liveCsvUrl) {
      return res.json({
        dataset: metaToLoadedDataset(meta, 'verified-sample'),
        meta,
        liveFetchAttempted: false,
      });
    }

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 7000);
      const resp = await fetch(meta.liveCsvUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!resp.ok) {
        throw new Error(`UCI server returned HTTP ${resp.status}`);
      }
      const rawText = await resp.text();
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      let headers = [...meta.sampleHeaders];
      const parsedRows: (string | number)[][] = [];

      if (meta.id === 186) {
        // winequality-red.csv has semicolon header row
        const hdr = lines[0].split(';').map((h) => h.replace(/^"|"$/g, '').trim());
        headers = [hdr[0], hdr[1], hdr[3], hdr[8], hdr[10], hdr[11]]; // curated clean numeric subset or full
        const fullHeaders = hdr;
        headers = fullHeaders;
        for (const line of lines.slice(1, 201)) {
          const cells = line.split(';').map((v) => Number(v.trim()));
          if (cells.length === fullHeaders.length && cells.every(Number.isFinite)) {
            parsedRows.push(cells);
          }
        }
      } else if (meta.id === 53) {
        // iris.data: 4 numeric + species string
        headers = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'class'];
        for (const line of lines.slice(0, 150)) {
          const parts = line.split(',').map((s) => s.trim());
          if (parts.length === 5) {
            parsedRows.push([Number(parts[0]), Number(parts[1]), Number(parts[2]), Number(parts[3]), parts[4]]);
          }
        }
      } else if (meta.id === 109) {
        // wine.data: cultivar (1/2/3), 13 features
        headers = ['cultivar', 'alcohol', 'malic_acid', 'ash', 'alcalinity', 'magnesium', 'phenols', 'flavanoids', 'nonflavanoid', 'proanthocyanins', 'color_intensity', 'hue', 'od280', 'proline'];
        for (const line of lines.slice(0, 178)) {
          const parts = line.split(',').map((s) => s.trim());
          if (parts.length === 14) {
            parsedRows.push([`Cultivar_${parts[0]}`, ...parts.slice(1).map(Number)]);
          }
        }
      } else if (meta.id === 17) {
        // wdbc.data: id, diagnosis(M/B), 30 features -> take diagnosis + first 5 clean mean features
        headers = ['mean_radius', 'mean_texture', 'mean_perimeter', 'mean_area', 'mean_smoothness', 'diagnosis'];
        for (const line of lines.slice(0, 200)) {
          const parts = line.split(',').map((s) => s.trim());
          if (parts.length >= 7) {
            parsedRows.push([
              Number(parts[2]),
              Number(parts[3]),
              Number(parts[4]),
              Number(parts[5]),
              Number(parts[6]),
              parts[1],
            ]);
          }
        }
      } else if (meta.id === 291) {
        // airfoil_self_noise.dat: whitespace delimited, 6 columns
        headers = ['frequency_hz', 'angle_attack_deg', 'chord_len_m', 'velocity_ms', 'thickness_m', 'scaled_sound_pressure_db'];
        for (const line of lines.slice(0, 200)) {
          const parts = line.split(/\s+/).map(Number);
          if (parts.length === 6 && parts.every(Number.isFinite)) parsedRows.push(parts);
        }
      } else if (meta.id === 236) {
        // seeds_dataset.txt: whitespace delimited, 7 numeric + variety (1/2/3)
        headers = ['area', 'perimeter', 'compactness', 'kernel_length', 'kernel_width', 'asymmetry', 'groove_len', 'variety'];
        const varNames: Record<string, string> = { '1': 'Kama', '2': 'Rosa', '3': 'Canadian' };
        for (const line of lines.slice(0, 210)) {
          const parts = line.split(/\s+/);
          if (parts.length === 8) {
            parsedRows.push([
              ...parts.slice(0, 7).map(Number),
              varNames[parts[7]] ?? `Variety_${parts[7]}`,
            ]);
          }
        }
      }

      if (parsedRows.length < 10) {
        throw new Error('Retrieved file format did not match expected tabular schema.');
      }

      return res.json({
        dataset: metaToLoadedDataset(meta, 'uci-live', parsedRows, headers),
        meta,
        liveFetchAttempted: true,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Network error accessing archive.ics.uci.edu';
      const fallback = metaToLoadedDataset(meta, 'verified-sample');
      fallback.note = `Live download from archive.ics.uci.edu unavailable (${reason}). Loaded verified UCI representative sample rows.`;
      return res.json({
        dataset: fallback,
        meta,
        liveFetchAttempted: true,
        liveError: reason,
      });
    }
  });

  // 6. Universal Algorithm Understanding (AI + Deterministic Local Parser)
  app.post('/api/ai/understand-algorithm', async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const input = String(req.body?.input ?? req.body?.inputText ?? '').trim();
    const language = String(req.body?.language ?? 'natural-language').trim();

    if (!name && !input) {
      return res.status(400).json({ error: 'Please provide an algorithm name, description, pseudocode, or code.' });
    }

    const safety = evaluateSafety(`${name} ${input}`);
    if (safety.level === 'RED') {
      return res.status(200).json({ blockedBySafety: true, safety });
    }

    const localSpec = parseLocalAlgorithmDescription(name, input, language);

    try {
      const catalogList = ALGORITHM_REGISTRY.map((a) => `${a.id}: ${a.name} (${a.visualizationKind})`).join('\n');
      const { data: parsed, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
        contents: `Student input algorithm (${language}):\nName: "${name || 'Unspecified'}"\nInput/Code:\n${input}\n\nExecutable Built-In Algorithm Registry (ONLY set matchedBuiltInId to one of these exact IDs if it is the same algorithm, otherwise null):\n${catalogList}`,
        systemInstruction: `You analyze student-submitted algorithms, pseudocode, Python/JavaScript snippets, and mathematical procedures. NEVER invent execution results or run untrusted code. Clearly classify executionStatus strictly as one of: "executable-builtin" (only if matchedBuiltInId matches a registry ID), "safe-traceable-code" (simple numeric array/loop trace), or "conceptual-walkthrough". Give crisp, honest, student-friendly steps and mathematical formulas.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiedName: { type: Type.STRING },
            matchedBuiltInId: { type: Type.STRING, nullable: true },
            category: { type: Type.STRING },
            purpose: { type: Type.STRING },
            inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
            outputs: { type: Type.ARRAY, items: { type: Type.STRING } },
            dataStructures: { type: Type.ARRAY, items: { type: Type.STRING } },
            algorithmLogicSummary: { type: Type.STRING },
            mathematicalPrinciples: { type: Type.ARRAY, items: { type: Type.STRING } },
            formula: { type: Type.STRING },
            complexity: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                space: { type: Type.STRING },
              },
              required: ['time', 'space'],
            },
            executionStatus: { type: Type.STRING },
            executionStatusReason: { type: Type.STRING },
            supportedVisualization: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  operation: { type: Type.STRING },
                  stateDescription: { type: Type.STRING },
                  mathOrLogic: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['stepNumber', 'operation', 'stateDescription', 'mathOrLogic', 'explanation'],
              },
            },
            limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'identifiedName',
            'category',
            'purpose',
            'inputs',
            'outputs',
            'dataStructures',
            'algorithmLogicSummary',
            'mathematicalPrinciples',
            'formula',
            'complexity',
            'executionStatus',
            'executionStatusReason',
            'supportedVisualization',
            'steps',
            'limitations',
          ],
        },
      });

      const validIds = new Set(ALGORITHM_REGISTRY.map((a) => a.id));
      const matchedId =
        typeof parsed.matchedBuiltInId === 'string' && validIds.has(parsed.matchedBuiltInId)
          ? parsed.matchedBuiltInId
          : localSpec.matchedBuiltInId;

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        specification: {
          ...parsed,
          matchedBuiltInId: matchedId,
          executionStatus: matchedId
            ? 'executable-builtin'
            : parsed.executionStatus === 'safe-traceable-code'
              ? 'safe-traceable-code'
              : 'conceptual-walkthrough',
          sourceMode: 'ai',
        },
      });
    } catch (err) {
      const info = classifyAiError(err);
      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
        fallbackSpecification: localSpec,
      });
    }
  });

  // 7. AI Smart Learning: Capabilities, Structured Lesson, TTS Narration & FFmpeg MP4 Video Engine
  app.get('/api/smart-learning/capabilities', (_req, res) => {
    res.json(getEnvironmentCapabilities());
  });

  app.post('/api/smart-learning/lesson', async (req, res) => {
    const topicQuery = String(req.body?.topicQuery ?? '').trim();
    const language = req.body?.language === 'kn' ? 'kn' : 'en';
    const educationLevel = String(req.body?.educationLevel ?? 'classes-8-10');
    const learningStyle = String(req.body?.learningStyle ?? 'visual');
    const durationPreset = String(req.body?.durationPreset ?? 'standard');
    const preferredSubject = String(req.body?.preferredSubject ?? 'auto');

    if (!topicQuery) {
      return res.status(400).json({ error: 'Please enter a theorem, science concept, algorithm, or experiment.' });
    }

    const safety = evaluateSafety(topicQuery);
    if (safety.level === 'RED') {
      return res.status(200).json({
        blockedBySafety: true,
        safety,
      });
    }

    try {
      const { lesson, aiWarning, modelUsed } = await generateSmartLessonService({
        topicQuery,
        language,
        educationLevel: educationLevel as Parameters<typeof generateSmartLessonService>[0]['educationLevel'],
        learningStyle: learningStyle as Parameters<typeof generateSmartLessonService>[0]['learningStyle'],
        durationPreset: durationPreset as Parameters<typeof generateSmartLessonService>[0]['durationPreset'],
        preferredSubject: preferredSubject as Parameters<typeof generateSmartLessonService>[0]['preferredSubject'],
      });

      return res.json({
        blockedBySafety: false,
        safety,
        lesson,
        aiWarning,
        modelUsed,
        capabilities: getEnvironmentCapabilities(),
      });
    } catch (err) {
      const info = classifyAiError(err);
      return res.status(info.statusCode).json({
        error: info.userMessage,
        code: info.code,
        retryable: info.retryable,
      });
    }
  });

  app.post('/api/smart-learning/tts', async (req, res) => {
    const text = String(req.body?.text ?? '').trim();
    const language = req.body?.language === 'kn' ? 'kn' : 'en';
    const voiceName = typeof req.body?.voiceName === 'string' ? req.body.voiceName : 'Kore';

    if (!text) {
      return res.status(400).json({ available: false, reason: 'Narration text is required.' });
    }

    const result = await synthesizeSceneSpeech({ text, language, voiceName });
    return res.json(result);
  });

  app.post('/api/smart-learning/render/init', (_req, res) => {
    return res.json(initRenderJob());
  });

  app.post('/api/smart-learning/render/:jobId/frames', (req, res) => {
    try {
      const frames = Array.isArray(req.body?.frames) ? req.body.frames.map(String) : [];
      const result = appendRenderFrames(req.params.jobId, frames);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Frame upload failed.' });
    }
  });

  app.post('/api/smart-learning/render/:jobId/finalize', async (req, res) => {
    try {
      const fps = Number(req.body?.fps ?? 8);
      const audioWavBase64 = typeof req.body?.audioWavBase64 === 'string' ? req.body.audioWavBase64 : null;
      const subtitlesSrt = typeof req.body?.subtitlesSrt === 'string' ? req.body.subtitlesSrt : undefined;
      const result = await finalizeRenderJob(req.params.jobId, {
        fps,
        audioWavBase64,
        subtitlesSrt,
      });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'MP4 compilation failed.' });
    }
  });

  app.get('/api/smart-learning/video/:fileName', (req, res) => {
    const found = getRenderedVideoFile(req.params.fileName);
    if (!found) {
      return res.status(404).json({ error: 'Rendered video file not found or expired.' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="stem-lesson-${req.params.fileName}"`);
    }
    return res.sendFile(found.filePath);
  });

  // 8. Authoritative Backend Virtual Lab Execution & Equipment/Wiring Validation
  app.post('/api/experiments/execute', (req, res) => {
    if (req.body?.simulateFailure === true) {
      return res.status(503).json({
        ok: false,
        status: 'failed',
        experimentId: String(req.body?.experimentId ?? ''),
        executedAt: new Date().toISOString(),
        error: 'Simulation worker temporarily unavailable. Your bench configuration and parameters have been preserved—click Retry.',
      });
    }

    const experimentId = String(req.body?.experimentId ?? '').trim();
    const params =
      req.body?.params && typeof req.body.params === 'object'
        ? (req.body.params as Record<string, number>)
        : {};
    const workbenchItems = Array.isArray(req.body?.workbenchItems) ? req.body.workbenchItems : [];
    const connections = Array.isArray(req.body?.connections) ? req.body.connections : [];

    if (!experimentId) {
      return res.status(400).json({
        ok: false,
        status: 'invalid_configuration',
        experimentId: '',
        executedAt: new Date().toISOString(),
        error: 'Experiment identifier is required to execute simulation.',
      });
    }

    const execution = executeScientificExperiment({
      experimentId,
      params,
      workbenchItems,
      connections,
    });

    if (!execution.ok) {
      return res.status(400).json(execution);
    }

    return res.json(execution);
  });

  // 9. Scientific Discovery Museum Multi-Turn Investigation Engine
  app.post('/api/ai/discovery-investigate', async (req, res) => {
    if (req.body?.simulateFailure === true) {
      return res.status(503).json({
        error: 'Discovery service temporarily unavailable. Your question has been preserved—please retry.',
      });
    }

    const question = String(req.body?.question ?? '').trim();
    const subject = String(req.body?.subject ?? 'Auto-detect').trim();
    const levelLabel = String(req.body?.levelLabel ?? 'Class 8').trim();
    const division = (req.body?.division ?? 'school') as 'school' | 'higher' | 'research';
    const branch = req.body?.branch;
    const language = String(req.body?.language ?? 'en').trim();
    const activePhenomenonContext = req.body?.activePhenomenonContext ?? null;
    const conversationHistory = Array.isArray(req.body?.conversationHistory)
      ? req.body.conversationHistory
      : [];

    if (!question) {
      return res.status(400).json({ error: 'Please enter a scientific question to investigate.' });
    }

    const safety = evaluateSafety(question);
    if (safety.level === 'RED') {
      return res.status(200).json({
        blockedBySafety: true,
        safety,
      });
    }

    const baseInvestigation = buildDiscoveryInvestigation({
      question,
      subject,
      levelLabel,
      division,
      branch,
      activePhenomenonContext,
      conversationHistory,
      safetyLevel: safety.level,
      safetySummary: safety.summary,
    });

    const videosPromise = baseInvestigation.isInScientificScope
      ? searchEducationalVideos({
          keywords: baseInvestigation.videoSearchKeywords,
          question: baseInvestigation.topicTitle || question,
          subject: baseInvestigation.subject,
        }).catch(() => [])
      : Promise.resolve([]);

    const aiSummary = getAiConfigurationSummary();
    if (!aiSummary.configured || !baseInvestigation.isInScientificScope) {
      const videos = await videosPromise;
      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed: 'deterministic-discovery-engine',
        videos,
        investigation: baseInvestigation,
      });
    }

    try {
      const langInstruction =
        language === 'kn'
          ? 'Write narrative fields in clear student-friendly Kannada while keeping SI equations in standard symbols.'
          : language === 'hi'
            ? 'Write narrative fields in clear student-friendly Hindi while keeping SI equations in standard symbols.'
            : 'Write narrative fields in clear, precise English.';

      const { data: enriched, modelUsed } = await generateStructuredJson<{
        directAnswer?: string;
        scientificExplanation?: string;
        underlyingPrinciple?: string;
        stepByStepMechanism?: string[];
        whereItOccurs?: string;
        microscopic?: string;
        macroscopic?: string;
        internalMechanisms?: string;
        causeSummary?: string;
        realWorldExamples?: string[];
        followUpQuestions?: string[];
      }>({
        contents: `Education Level: ${levelLabel} (${division})\nSubject Filter: ${subject}\nPrevious Topic Context: ${activePhenomenonContext?.topicTitle || 'Fresh inquiry'}\nBaseline Phenomenon Title: ${baseInvestigation.topicTitle}\nStudent Question: "${question}"`,
        systemInstruction: `You are OmniLab's Scientific Discovery Engine ("OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY"). ${langInstruction} Be strictly scientifically accurate, adapt depth to "${levelLabel}", preserve topic continuity if this is a follow-up question, and never fabricate unsafe procedures.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directAnswer: { type: Type.STRING },
            scientificExplanation: { type: Type.STRING },
            underlyingPrinciple: { type: Type.STRING },
            stepByStepMechanism: { type: Type.ARRAY, items: { type: Type.STRING } },
            whereItOccurs: { type: Type.STRING },
            microscopic: { type: Type.STRING },
            macroscopic: { type: Type.STRING },
            internalMechanisms: { type: Type.STRING },
            causeSummary: { type: Type.STRING },
            realWorldExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['directAnswer', 'scientificExplanation', 'underlyingPrinciple'],
        },
      });

      const videos = await videosPromise;
      const merged = {
        ...baseInvestigation,
        directAnswer: enriched.directAnswer || baseInvestigation.directAnswer,
        scientificExplanation: enriched.scientificExplanation || baseInvestigation.scientificExplanation,
        underlyingPrinciple: enriched.underlyingPrinciple || baseInvestigation.underlyingPrinciple,
        stepByStepMechanism:
          Array.isArray(enriched.stepByStepMechanism) && enriched.stepByStepMechanism.length > 0
            ? enriched.stepByStepMechanism
            : baseInvestigation.stepByStepMechanism,
        whereItOccurs: enriched.whereItOccurs || baseInvestigation.whereItOccurs,
        microAndMacroView: {
          microscopic: enriched.microscopic || baseInvestigation.microAndMacroView.microscopic,
          macroscopic: enriched.macroscopic || baseInvestigation.microAndMacroView.macroscopic,
        },
        internalMechanisms: enriched.internalMechanisms || baseInvestigation.internalMechanisms,
        causeAndEffectAnalysis: {
          ...baseInvestigation.causeAndEffectAnalysis,
          whyItChanges: enriched.causeSummary || baseInvestigation.causeAndEffectAnalysis.whyItChanges,
        },
        realWorldExamples:
          Array.isArray(enriched.realWorldExamples) && enriched.realWorldExamples.length > 0
            ? enriched.realWorldExamples
            : baseInvestigation.realWorldExamples,
        followUpQuestions:
          Array.isArray(enriched.followUpQuestions) && enriched.followUpQuestions.length > 0
            ? enriched.followUpQuestions
            : baseInvestigation.followUpQuestions,
        sourceMode: 'ai' as const,
      };

      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed,
        videos,
        investigation: merged,
      });
    } catch {
      const videos = await videosPromise;
      return res.json({
        blockedBySafety: false,
        safety,
        modelUsed: 'deterministic-discovery-fallback',
        videos,
        investigation: baseInvestigation,
      });
    }
  });

  // Serve Vite middleware in development or built dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
