export const PRIORITY_WEIGHTS = {
  SEVERITY: 0.30,
  POPULATION: 0.25,
  URGENCY: 0.20,
  PUBLIC_SAFETY: 0.15,
  RECURRENCE: 0.10,
} as const;

export const PRIORITY_BANDS = {
  LOW: { min: 0, max: 39.99 },
  MEDIUM: { min: 40.0, max: 59.99 },
  HIGH: { min: 60.0, max: 79.99 },
  CRITICAL: { min: 80.0, max: 100 },
} as const;

export const UNIVERSITY_MATCH_WEIGHTS = {
  FACULTY_EXPERTISE: 0.30,
  DEPARTMENT: 0.20,
  PREVIOUS_PROJECTS: 0.20,
  LABORATORY_CAPABILITY: 0.15,
  PREVIOUS_SUCCESS: 0.10,
  GEOGRAPHICAL_SUITABILITY: 0.05,
} as const;

export const INDUSTRY_MATCH_WEIGHTS = {
  TECH_EXPERTISE: 0.30,
  MENTORSHIP: 0.20,
  TECH_APIS: 0.15,
  FUNDING: 0.15,
  EQUIPMENT: 0.10,
  DEPLOYMENT_GEOGRAPHY: 0.10,
} as const;

export const IMPACT_WEIGHTS = {
  POPULATION_BENEFITED: 0.25,
  PROBLEM_REDUCTION: 0.30,
  CITIZEN_SATISFACTION: 0.20,
  SUSTAINABILITY: 0.15,
  DEPLOYMENT_SUCCESS: 0.10,
} as const;

export const IRL_DEFINITIONS = [
  { level: 'IRL_0', label: 'IRL-0', name: 'Problem Reported', order: 0 },
  { level: 'IRL_1', label: 'IRL-1', name: 'Problem Validated', order: 1 },
  { level: 'IRL_2', label: 'IRL-2', name: 'Research Completed', order: 2 },
  { level: 'IRL_3', label: 'IRL-3', name: 'Concept Developed', order: 3 },
  { level: 'IRL_4', label: 'IRL-4', name: 'Prototype Developed', order: 4 },
  { level: 'IRL_5', label: 'IRL-5', name: 'Prototype Tested', order: 5 },
  { level: 'IRL_6', label: 'IRL-6', name: 'Community Pilot', order: 6 },
  { level: 'IRL_7', label: 'IRL-7', name: 'Deployment Ready', order: 7 },
  { level: 'IRL_8', label: 'IRL-8', name: 'Deployed', order: 8 },
  { level: 'IRL_9', label: 'IRL-9', name: 'Impact Verified', order: 9 },
] as const;

