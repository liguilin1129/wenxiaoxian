import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<any>();
    const header = String(request.headers.authorization || '');
    if (!header.startsWith('Bearer ')) throw new UnauthorizedException('缺少登录令牌');
    request.admin = await this.auth.current(header.slice(7));
    return true;
  }
}
