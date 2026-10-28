import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { OrgType, VerificationStatus } from '@prisma/client';

export class OrganizationsService {
  public static async list(filter: {
    type?: OrgType;
    district?: string;
    verifiedStatus?: VerificationStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.type) where.type = filter.type;
    if (filter.district) where.district = { contains: filter.district, mode: 'insensitive' };
    if (filter.verifiedStatus) where.verifiedStatus = filter.verifiedStatus;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          departments: true,
          laboratories: true,
          industryCapability: true,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async getById(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            facultyProfiles: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            laboratories: true,
          },
        },
        laboratories: true,
        industryCapability: true,
        facultyProfiles: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: true,
          },
        },
        teams: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  public static async create(data: {
    name: string;
    type: OrgType;
    description?: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    district: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    areasOfExpertise?: string[];
  }) {
    return prisma.organization.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        website: data.website,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        district: data.district,
        state: data.state || 'Jharkhand',
        latitude: data.latitude,
        longitude: data.longitude,
        areasOfExpertise: data.areasOfExpertise || [],
        verifiedStatus: VerificationStatus.VERIFIED, // auto-verified when created by admin
      },
    });
  }

  public static async update(
    id: string,
    data: any,
    user: { id: string; roles: string[]; orgId?: string }
  ) {
    // Only platform admin or university admin of the specific organization can edit
    if (!user.roles.includes('PLATFORM_ADMIN') && user.orgId !== id) {
      throw new ForbiddenError('You can only modify your own organization profile');
    }

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundError('Organization not found');

    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  public static async addDepartment(
    orgId: string,
    data: { name: string; code: string; description?: string; headOfDepartment?: string },
    user: { id: string; roles: string[]; orgId?: string }
  ) {
    if (!user.roles.includes('PLATFORM_ADMIN') && user.orgId !== orgId) {
      throw new ForbiddenError('Unauthorized to add department to this institution');
    }

    return prisma.department.create({
      data: {
        organizationId: orgId,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        headOfDepartment: data.headOfDepartment,
      },
    });
  }

  public static async addLaboratory(
    orgId: string,
    data: {
      name: string;
      code: string;
      departmentId?: string;
      capabilities: string[];
      equipmentList: string[];
      facilityDescription?: string;
    },
    user: { id: string; roles: string[]; orgId?: string }
  ) {
    if (!user.roles.includes('PLATFORM_ADMIN') && user.orgId !== orgId) {
      throw new ForbiddenError('Unauthorized to add laboratory to this institution');
    }

    return prisma.laboratory.create({
      data: {
        organizationId: orgId,
        departmentId: data.departmentId,
        name: data.name,
        code: data.code.toUpperCase(),
        capabilities: data.capabilities,
        equipmentList: data.equipmentList,
        facilityDescription: data.facilityDescription,
      },
    });
  }
}

