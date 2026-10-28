import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';
import { OrgType } from '@prisma/client';

export class IndustryService {
  public static async listPartners(filter: {
    district?: string;
    domain?: string;
    type?: OrgType;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      type: filter.type || {
        in: [
          OrgType.INDUSTRY_COMPANY,
          OrgType.STARTUP,
          OrgType.CSR_ORG,
        ],
      },
    };

    if (filter.district) where.district = filter.district;

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          collaborations: {
            select: { id: true, collaborationType: true, status: true },
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

  public static async getPartnerById(id: string) {
    const partner = await prisma.organization.findFirst({
      where: {
        id,
        type: {
          in: [
            OrgType.INDUSTRY_COMPANY,
            OrgType.STARTUP,
            OrgType.CSR_ORG,
          ],
        },
      },
      include: {
        collaborations: {
          include: {
            challenge: { select: { id: true, title: true, referenceNumber: true } },
            project: { select: { id: true, title: true, currentIrl: true } },
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundError('Industry partner organization not found');
    }

    return partner;
  }
}
