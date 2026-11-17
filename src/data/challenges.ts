import type { ChallengeItem } from '../types/science';

export const INNOVATION_CHALLENGES: ChallengeItem[] = [
  {
    id: 'chal-water',
    title: 'Greywater & Rainwater Micro-Filtration',
    theme: 'Water conservation',
    summary:
      'Design a low-cost multi-layer gravity filter or solar condensation unit that reduces household freshwater demand while testing flow rate vs particle density.',
    scientificFocus: ['Density & Sedimentation', 'Boiling/Condensation', 'Flow Geometry'],
    suggestedExperimentId: 'mass-volume-density',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-plastic',
    title: 'Plastic Waste Sorting & Upcycling Concept',
    theme: 'Plastic waste',
    summary:
      'Use density differences between common polymers (PET, HDPE, PP) in safe salt/water baths to design a zero-heat mechanical sorting separator.',
    scientificFocus: ['Material Density', 'Buoyancy Separation', 'Circular Design'],
    suggestedExperimentId: 'mass-volume-density',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-renewable',
    title: 'Community Solar Angle & Micro-Grid Tracker',
    theme: 'Renewable energy',
    summary:
      'Model how irradiance distance, panel angle, and load resistance affect DC current output for off-grid classroom lighting.',
    scientificFocus: ['Inverse-Square Irradiance', 'Ohm’s Law DC Circuits', 'Energy Efficiency'],
    suggestedExperimentId: 'voltage-current',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-farming',
    title: 'Shaded Greenhouse Photosynthesis Optimizer',
    theme: 'Farming technology',
    summary:
      'Balance supplemental LED light intensity against saturation limits (P_max and K) so crops grow efficiently without wasted electricity.',
    scientificFocus: ['Photosynthesis Light Curve', 'Inverse-Square Law', 'Thermal Control'],
    suggestedExperimentId: 'photosynthesis-rate',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-education',
    title: 'Tactile Low-Cost Science Kit for Offline Classrooms',
    theme: 'Accessible education',
    summary:
      'Prototype a simple pendulum, density balance, or optical bench built from recyclable household parts so every school can verify physical laws hands-on.',
    scientificFocus: ['Simple Pendulum Mechanics', 'Measurement Precision', 'Inclusive Design'],
    suggestedExperimentId: 'pendulum-period',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-disaster',
    title: 'Passive Cooling Shelter for Heatwave Resilience',
    theme: 'Disaster preparedness',
    summary:
      'Apply Newton’s Law of Cooling and reflective shielding to slow indoor heat buildup during power outages.',
    scientificFocus: ['Heat Transfer', 'Newton’s Cooling Curve', 'Thermal Mass'],
    suggestedExperimentId: 'newtons-cooling',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-food-waste',
    title: 'Solar-Evaporative Cold Storage for Produce',
    theme: 'Food waste',
    summary:
      'Slow spoilage reactions modeled by the Arrhenius equation by lowering storage temperature by 10–15 K using evaporative clay or phase-change chambers.',
    scientificFocus: ['Arrhenius Reaction Kinetics', 'Evaporative Cooling', 'Food Preservation'],
    suggestedExperimentId: 'reaction-rate',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-monitoring',
    title: 'Low-Voltage Optical Turbidity & Water Quality Sensor',
    theme: 'Environmental monitoring',
    summary:
      'Combine a safe 5 V LED and light-dependent resistor circuit to detect suspended particles in local pond or runoff water samples.',
    scientificFocus: ['Light Attenuation', 'DC Voltage-Current', 'Environmental Telemetry'],
    suggestedExperimentId: 'light-distance',
    safetyLevel: 'AMBER',
  },
  {
    id: 'chal-transport',
    title: 'Regenerative Braking & Lightweight Mobility Concept',
    theme: 'Transportation',
    summary:
      'Calculate how reducing vehicle mass decreases the force required for acceleration and improves stopping efficiency.',
    scientificFocus: ['Newton’s Second Law (F=ma)', 'Kinetic Energy', 'Friction Control'],
    suggestedExperimentId: 'force-acceleration',
    safetyLevel: 'GREEN',
  },
  {
    id: 'chal-healthcare',
    title: 'Insulated Vaccine Carrier Thermal Monitor',
    theme: 'Low-cost healthcare solutions',
    summary:
      'Design a passive insulated carrier box and predict how long medicines stay within safe temperature thresholds using Newton’s Law of Cooling.',
    scientificFocus: ['Exponential Thermal Decay', 'Insulation Coefficient k', 'Public Health Logistics'],
    suggestedExperimentId: 'newtons-cooling',
    safetyLevel: 'GREEN',
  },
];
