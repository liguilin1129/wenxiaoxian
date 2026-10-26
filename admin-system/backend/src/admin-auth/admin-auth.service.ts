import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

type TokenPayload = { sub: string; exp: number };

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user || user.status !== 'ACTIVE' || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const token = this.sign({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 });
    await this.prisma.auditLog.create({ data: { actorId: user.id, action: 'admin.login', resource: 'admin_user', resourceId: user.id, ip } });
    return { token, user: this.publicUser(user) };
  }

  async current(token: string) {
    const payload = this.verify(token);
    if (!payload) throw new UnauthorizedException('登录已失效，请重新登录');
    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('账号不可用');
    return this.publicUser(user);
  }

  private secret() { return process.env.ADMIN_TOKEN_SECRET || ''; }
  private sign(payload: TokenPayload) {
    if (!this.secret()) throw new Error('ADMIN_TOKEN_SECRET 未配置');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.secret()).update(body).digest('base64url');
    return `${body}.${signature}`;
  }
  private verify(token: string): TokenPayload | null {
    if (!token || !this.secret()) return null;
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = createHmac('sha256', this.secret()).update(body).digest('base64url');
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try { const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload; return payload.exp > Math.floor(Date.now() / 1000) ? payload : null; } catch { return null; }
  }
  private publicUser(user: any) {
    const roles = user.roles.map((entry: any) => entry.role.code);
    const permissions = [...new Set(user.roles.flatMap((entry: any) => entry.role.permissions.map((item: any) => item.permission.code)))];
    return { id: user.id, email: user.email, displayName: user.displayName, roles, permissions };
  }
}
