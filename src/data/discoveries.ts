import type { DiscoveryItem } from '../types/science';

export const DISCOVERY_CATEGORIES = [
  'All',
  'Space',
  'AI',
  'Robotics',
  'Medicine',
  'Environment',
  'Renewable Energy',
  'Physics',
  'Chemistry',
  'Biology',
  'Agriculture',
  'Engineering',
] as const;

export const WORLD_DISCOVERIES: DiscoveryItem[] = [
  {
    id: 'jwst-deep-field',
    title: 'James Webb Space Telescope Infrared Deep-Field Observations',
    category: 'Space',
    date: 'July 2022 – Ongoing',
    institution: 'NASA / ESA / CSA',
    status: 'Verified Discovery',
    summary:
      'Using a 6.5-meter gold-coated beryllium mirror at the Sun–Earth L2 point, JWST captures faint infrared light stretched by cosmic expansion from galaxies formed a few hundred million years after the Big Bang.',
    whyItMatters:
      'Allows astronomers to inspect early galaxy structure, star formation, and exoplanet atmospheric absorption spectra with unprecedented sensitivity.',
    concepts: ['Infrared Spectroscopy', 'Cosmological Redshift', 'Inverse-Square Law of Light'],
    sourceName: 'NASA Science — James Webb Space Telescope',
    sourceUrl: 'https://science.nasa.gov/mission/webb/',
  },
  {
    id: 'ligo-gravitational-waves',
    title: 'Direct Detection of Gravitational Waves (GW150914)',
    category: 'Physics',
    date: 'September 2015 (Announced February 2016)',
    institution: 'LIGO Scientific Collaboration & Virgo Collaboration',
    status: 'Verified Discovery',
    summary:
      'Laser interferometers with 4 km perpendicular arms measured sub-proton spacetime ripples caused by two colliding black holes roughly 1.3 billion light-years away.',
    whyItMatters:
      'Confirmed a key prediction of Einstein’s General Relativity and opened gravitational-wave astronomy alongside electromagnetic telescopes.',
    concepts: ['Laser Interferometry', 'Wave Interference', 'General Relativity'],
    sourceName: 'Caltech / LIGO Laboratory',
    sourceUrl: 'https://www.ligo.caltech.edu/page/what-are-gw',
  },
  {
    id: 'alphafold-protein-db',
    title: 'AlphaFold Protein Structure Database',
    category: 'AI',
    date: 'July 2021 – 2024',
    institution: 'Google DeepMind & EMBL-EBI',
    status: 'Peer-Reviewed Research',
    summary:
      'Deep learning models trained on known experimental protein structures predicted 3D atomic coordinates for over 200 million catalogued protein sequences.',
    whyItMatters:
      'Accelerates structural biology research into enzyme catalysis, antibiotic resistance, and neglected tropical diseases.',
    concepts: ['Protein Folding', 'Amino Acid Interactions', 'Machine Learning'],
    sourceName: 'EMBL-EBI AlphaFold Database',
    sourceUrl: 'https://alphafold.ebi.ac.uk/',
  },
  {
    id: 'crispr-gene-editing',
    title: 'CRISPR-Cas9 Programmable Genome Editing',
    category: 'Biology',
    date: '2012 (Nobel Prize 2020)',
    institution: 'UC Berkeley, Umeå University & Broad Institute',
    status: 'Verified Discovery',
    summary:
      'Adapted a bacterial immune defense system so guide RNA directs the Cas9 enzyme to make targeted DNA cuts at chosen genetic sequences.',
    whyItMatters:
      'Enabled precise research into inherited genetic disorders, crop resilience, and cellular biology.',
    concepts: ['Base Pairing', 'Nucleic Acid Enzymes', 'Cellular Repair'],
    sourceName: 'Nobel Prize Outreach — Chemistry 2020',
    sourceUrl: 'https://www.nobelprize.org/prizes/chemistry/2020/summary/',
  },
  {
    id: 'perovskite-silicon-tandem',
    title: 'Perovskite–Silicon Tandem Solar Cell Efficiency Milestones',
    category: 'Renewable Energy',
    date: '2023 – 2024',
    institution: 'Helmholtz-Zentrum Berlin & NREL Certified Labs',
    status: 'Validated Prototype',
    summary:
      'Stacking a perovskite top layer that absorbs blue/green photons above a silicon bottom cell that captures red/infrared photons pushes certified lab efficiencies beyond single-junction silicon limits.',
    whyItMatters:
      'Higher solar conversion efficiency reduces land area and material cost per kilowatt-hour of clean electricity.',
    concepts: ['Bandgap Energy', 'Photon Absorption', 'Ohmic Losses'],
    sourceName: 'NREL Best Research-Cell Efficiency Chart',
    sourceUrl: 'https://www.nrel.gov/pv/cell-efficiency.html',
  },
  {
    id: 'mrna-nucleoside-modification',
    title: 'Nucleoside-Modified mRNA Therapeutics',
    category: 'Medicine',
    date: '2005 – 2020 (Nobel Prize 2023)',
    institution: 'University of Pennsylvania (Karikó & Weissman)',
    status: 'Verified Discovery',
    summary:
      'Replacing uridine with pseudouridine in synthetic messenger RNA prevented unwanted inflammatory responses while preserving protein translation inside cells.',
    whyItMatters:
      'Provided the biochemical foundation for rapid mRNA vaccine design and targeted therapeutic research.',
    concepts: ['Ribosomal Translation', 'Lipid Nanoparticles', 'Immune Signaling'],
    sourceName: 'Nobel Prize Outreach — Medicine 2023',
    sourceUrl: 'https://www.nobelprize.org/prizes/medicine/2023/summary/',
  },
  {
    id: 'cern-higgs-boson',
    title: 'Observation of the Higgs Boson at the Large Hadron Collider',
    category: 'Physics',
    date: 'July 2012',
    institution: 'CERN (ATLAS & CMS Collaborations)',
    status: 'Verified Discovery',
    summary:
      'High-energy proton collisions inside the 27 km superconducting ring revealed a 125 GeV boson consistent with the Standard Model mechanism that gives fundamental particles mass.',
    whyItMatters:
      'Completed the Standard Model particle spectrum and sharpened precision tests of fundamental forces.',
    concepts: ['Electroweak Symmetry', 'Particle Detectors', 'Conservation of Momentum'],
    sourceName: 'CERN — The Higgs Boson',
    sourceUrl: 'https://home.cern/science/physics/higgs-boson',
  },
  {
    id: 'ocean-cleanup-interception',
    title: 'Autonomous Riverine Plastic Interception & Flow Telemetry',
    category: 'Environment',
    date: '2019 – Ongoing',
    institution: 'TU Delft / International River Monitoring Consortia',
    status: 'Validated Prototype',
    summary:
      'Solar-powered floating conveyor barriers placed at river mouths guide drifting plastic debris into sorting hoppers using natural river current geometry.',
    whyItMatters:
      'Intercepting plastic in major rivers before it fragments into microplastics at sea lowers marine ecosystem damage.',
    concepts: ['Fluid Dynamics', 'Buoyancy & Density', 'Solar Power Budgeting'],
    sourceName: 'UNEP — Plastic Pollution Science',
    sourceUrl: 'https://www.unep.org/plastic-pollution',
  },
  {
    id: 'mof-water-harvesting',
    title: 'Metal–Organic Framework (MOF) Atmospheric Water Harvesting',
    category: 'Chemistry',
    date: '2017 – 2023',
    institution: 'UC Berkeley & MIT Collaborations',
    status: 'Peer-Reviewed Research',
    summary:
      'Porous crystalline MOF powders trap water vapour overnight even at low desert humidity (< 20% RH) and release liquid water using gentle ambient solar heat during the day.',
    whyItMatters:
      'Demonstrates passive chemical adsorption cycles capable of producing clean drinking water in arid regions without grid electricity.',
    concepts: ['Adsorption Equilibrium', 'Evaporation & Condensation', 'Porous Crystal Lattices'],
    sourceName: 'MIT News — Water Harvesting Research',
    sourceUrl: 'https://news.mit.edu/topic/water',
  },
  {
    id: 'precision-drip-agritech',
    title: 'Soil Moisture Sensor-Driven Precision Micro-Irrigation',
    category: 'Agriculture',
    date: 'Ongoing Peer-Reviewed Field Studies',
    institution: 'FAO & Global Agricultural Research Networks',
    status: 'Peer-Reviewed Research',
    summary:
      'Capacitive root-zone moisture probes combined with evapotranspiration models deliver water only when soil matric potential crosses crop stress thresholds.',
    whyItMatters:
      'Cuts freshwater waste in agriculture while maintaining photosynthesis and root oxygenation.',
    concepts: ['Photosynthesis Limiting Factors', 'Soil Dielectric Constant', 'Water Conservation'],
    sourceName: 'FAO — Water Efficiency in Agriculture',
    sourceUrl: 'https://www.fao.org/land-water/water/water-management/en/',
  },
  {
    id: 'soft-robotics-actuators',
    title: 'Pneumatic Soft Robotic Grippers for Delicate Handling',
    category: 'Robotics',
    date: '2014 – Ongoing',
    institution: 'Harvard Wyss Institute & Global Robotics Labs',
    status: 'Validated Prototype',
    summary:
      'Compliant elastomer chambers bend smoothly under controlled low air pressure to grasp fragile fruit, glassware, or medical instruments without rigid force spikes.',
    whyItMatters:
      'Replaces heavy rigid actuators with adaptable, safer mechanics for agriculture and assistive robotics.',
    concepts: ['Gas Pressure & Force', 'Elasticity', 'Closed-Loop Feedback'],
    sourceName: 'Wyss Institute — Soft Robotics',
    sourceUrl: 'https://wyss.harvard.edu/technology/soft-robotics/',
  },
  {
    id: 'james-dyson-modular-desalination',
    title: 'Passive Multi-Stage Solar Desalination Stills',
    category: 'Engineering',
    date: '2020 – 2024',
    institution: 'MIT Device Research Laboratory',
    status: 'Validated Prototype',
    summary:
      'Stacked thermal stages recover the latent heat released when steam condenses on one plate to evaporate seawater on the next, multiplying freshwater output per square meter of sunlight.',
    whyItMatters:
      'Shows how thermodynamic heat recovery dramatically improves low-cost clean water engineering.',
    concepts: ['Latent Heat of Vaporization', 'Newton’s Law of Cooling', 'Saturation Vapour Pressure'],
    sourceName: 'MIT News — Solar Desalination',
    sourceUrl: 'https://news.mit.edu/topic/desalination',
  },
];
