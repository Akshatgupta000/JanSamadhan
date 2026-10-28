import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';

export class TaxonomiesService {
  public static async list(type?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;

    return prisma.taxonomy.findMany({
      where,
      include: {
        children: { where: { isActive: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  public static async create(data: {
    type: string;
    code: string;
    name: string;
    description?: string;
    parentId?: string;
  }) {
    return prisma.taxonomy.create({
      data: {
        type: data.type,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        parentId: data.parentId,
      },
    });
  }

  public static async update(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean }
  ) {
    const existing = await prisma.taxonomy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Taxonomy not found');

    return prisma.taxonomy.update({
      where: { id },
      data,
    });
  }
}

