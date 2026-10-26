import { Body, Controller, Get, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}
  @Post('login') login(@Body() body: LoginDto, @Ip() ip: string) { return this.auth.login(body.email, body.password, ip); }
  @Get('me') @UseGuards(AdminAuthGuard) me(@Req() request: any) { return { user: request.admin }; }
}
