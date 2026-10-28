import { describe, it, expect } from 'vitest';
import {
  UniversityMatchingCalculator,
  UniversityCapabilityData,
} from '../../src/modules/matching/university-matching.calculator';
import { GeospatialUtil } from '../../src/common/utils/geospatial';

describe('UniversityMatchingCalculator Unit Tests', () => {
  const challenge = {
    domain: 'Water Management',
    subdomain: 'Rural Drinking Water',
    requiredExpertise: ['Civil Engineering', 'Water Resources', 'IoT Monitoring', 'GIS'],
    district: 'Khunti',
    latitude: 23.0722,
    longitude: 85.2755,
  };

  const universities: UniversityCapabilityData[] = [
    {
      id: 'univ-bit-mesra',
      name: 'Birla Institute of Technology, Mesra',
      district: 'Ranchi', // Neighboring district (~40km)
      latitude: 23.4123,
      longitude: 85.4399,
      departments: [
        { id: 'd1', name: 'Department of Civil and Environmental Engineering', code: 'CIVIL' },
      ],
      facultyProfiles: [
        {
          id: 'f1',
          designation: 'Associate Professor',
          expertiseAreas: ['Civil Engineering', 'Water Resources', 'IoT Monitoring', 'GIS'],
          researchInterests: ['Rural Groundwater Scarcity'],
          previousDeploymentCount: 4,
          publicationCount: 32,
        },
      ],
      laboratories: [
        {
          id: 'l1',
          name: 'Water Resources & IoT Systems Research Centre',
          capabilities: ['Water quality assessment', 'IoT telemetry testbench'],
          equipmentList: ['Spectrophotometer', 'Pressure Transducers'],
        },
      ],
      verifiedSuccessCount: 3,
    },
    {
      id: 'univ-nit-jamshedpur',
      name: 'National Institute of Technology, Jamshedpur',
      district: 'East Singhbhum', // Further (~110km)
      latitude: 22.7758,
      longitude: 86.1437,
      departments: [
        { id: 'd2', name: 'Department of Metallurgical Engineering', code: 'MET' },
      ],
      facultyProfiles: [
        {
          id: 'f2',
          designation: 'Assistant Professor',
          expertiseAreas: ['Materials Science'],
          researchInterests: ['Corrosion'],
          previousDeploymentCount: 0,
          publicationCount: 5,
        },
      ],
      laboratories: [],
      verifiedSuccessCount: 0,
    },
  ];

  it('should rank university with matched departments, faculty, and labs ahead of unmatched', () => {
    const results = UniversityMatchingCalculator.rankUniversities(challenge, universities);

    expect(results).toHaveLength(2);
    expect(results[0].universityId).toBe('univ-bit-mesra');
    expect(results[0].rank).toBe(1);
    expect(results[1].universityId).toBe('univ-nit-jamshedpur');
    expect(results[1].rank).toBe(2);

    expect(results[0].totalScore).toBeGreaterThan(results[1].totalScore);
    expect(results[0].factorBreakdown).toHaveLength(6);
    expect(results[0].whyRecommended).toContain('Departments');
    expect(results[0].whyRecommended).toContain('Faculty Expertise');
  });

  it('should calculate score coverage indicator correctly when laboratory data is missing', () => {
    const results = UniversityMatchingCalculator.rankUniversities(challenge, universities);
    const bitCoverage = results[0].scoreCoverage;
    const nitCoverage = results[1].scoreCoverage;

    expect(bitCoverage).toBe(1.0); // Full coverage (faculty, dept, labs available)
    expect(nitCoverage).toBeLessThan(1.0); // Missing labs -> lower coverage
  });

  it('should score geographic suitability higher for same or adjacent district', () => {
    const sameDistrictScore = GeospatialUtil.scoreGeographicSuitability(
      23.0, 85.0, 'Khunti',
      23.05, 85.02, 'Khunti'
    );
    const nearbyScore = GeospatialUtil.scoreGeographicSuitability(
      23.07, 85.27, 'Khunti',
      23.41, 85.43, 'Ranchi'
    );
    const farScore = GeospatialUtil.scoreGeographicSuitability(
      23.07, 85.27, 'Khunti',
      28.61, 77.20, 'New Delhi'
    );

    expect(sameDistrictScore).toBe(100);
    expect(nearbyScore).toBeGreaterThanOrEqual(85);
    expect(farScore).toBeLessThanOrEqual(30);
  });
});

