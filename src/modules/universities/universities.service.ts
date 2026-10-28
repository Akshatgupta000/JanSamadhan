import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';
import { OrgType } from '@prisma/client';

export class UniversitiesService {
  public static async list(filter: { district?: string; page?: number; limit?: number }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { type: OrgType.UNIVERSITY };
    if (filter.district) where.district = filter.district;

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          departments: true,
          laboratories: true,
          _count: {
            select: {
              facultyProfiles: true,
              teams: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.organization.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async getById(id: string) {
    const university = await prisma.organization.findFirst({
      where: { id, type: OrgType.UNIVERSITY },
      include: {
        departments: true,
        laboratories: true,
        facultyProfiles: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        teams: {
          include: {
            challenge: { select: { id: true, title: true, referenceNumber: true } },
            projects: { select: { id: true, title: true, currentIrl: true, status: true } },
          },
        },
      },
    });

    if (!university) {
      throw new NotFoundError('University organization not found');
    }

    return university;
  }

  public static async getCapabilities(id: string) {
    const university = await this.getById(id);

    // Aggregate capabilities, faculty skills, equipment
    const departmentNames = university.departments.map((d) => d.name);
    const labCapabilities = university.laboratories.map((l) => ({
      name: l.name,
      capabilities: l.capabilities,
      equipment: l.equipmentList,
    }));

    const facultySkills = Array.from(
      new Set(university.facultyProfiles.flatMap((f) => f.expertiseAreas || []))
    );

    const completedProjects = university.teams.flatMap((t) =>
      t.projects.filter((p) => p.status === 'COMPLETED')
    );

    return {
      universityId: university.id,
      name: university.name,
      district: university.district,
      verifiedStatus: university.verifiedStatus,
      departments: departmentNames,
      specializedLaboratories: labCapabilities,
      facultyExpertiseAreas: facultySkills,
      facultyCount: university.facultyProfiles.length,
      historicalProjectsCount: university.teams.flatMap((t) => t.projects).length,
      completedProjectsCount: completedProjects.length,
      collaborationPreferences: university.collaborationPreferences,
    };
  }
}
