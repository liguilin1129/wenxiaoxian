import { Injectable } from '@nestjs/common';
import { LedgerType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDataService {
  constructor(private readonly prisma: PrismaService) {}
  async users(page: number, pageSize: number, keyword = '') {
    const where: Prisma.AppUserWhereInput = keyword ? { OR: [{ nickname: { contains: keyword, mode: 'insensitive' } }, { wechatId: { contains: keyword, mode: 'insensitive' } }, { families: { some: { family: { name: { contains: keyword, mode: 'insensitive' } } } } }] } : {};
    const [total, items] = await this.prisma.$transaction([
      this.prisma.appUser.count({ where }),
      this.prisma.appUser.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { families: { include: { family: true } } } })
    ]);
    return { total, page, pageSize, items: items.map((item) => ({ id: item.id, wechatId: item.wechatId, nickname: item.nickname, avatarUrl: item.avatarUrl, families: item.families.map((member) => ({ id: member.family.id, name: member.family.name, role: member.role })), createdAt: item.createdAt })) };
  }
  async ledgers(page: number, pageSize: number, keyword = '', type?: LedgerType) {
    const where: Prisma.PointLedgerWhereInput = { ...(type ? { type } : {}), ...(keyword ? { OR: [{ idempotencyKey: { contains: keyword, mode: 'insensitive' } }, { referenceType: { contains: keyword, mode: 'insensitive' } }, { user: { nickname: { contains: keyword, mode: 'insensitive' } } }] } : {}) };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.pointLedger.count({ where }),
      this.prisma.pointLedger.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { user: true } })
    ]);
    return { total, page, pageSize, items: items.map((item) => ({ ...item, user: { id: item.user.id, nickname: item.user.nickname, wechatId: item.user.wechatId } })) };
  }
}
