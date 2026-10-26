import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('系统')
@Controller()
export class AppController {
  @Get('health')
  health() {
    return { ok: true, service: 'wenxiaoxian-admin-api', timestamp: new Date().toISOString() };
  }
}
