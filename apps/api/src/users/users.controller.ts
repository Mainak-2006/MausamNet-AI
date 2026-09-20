import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AuthedUser } from '../auth/types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthedUser) {
    return this.users.me(user);
  }

  @ApiBearerAuth()
  @Patch('me')
  updateUser(@CurrentUser() user: AuthedUser, @Body() dto: UpdateProfileDto) {
    return this.users.update(user, dto);
  }

  @ApiBearerAuth()
  @Get('me/reports')
  myReports(@CurrentUser() user: AuthedUser) {
    return this.users.myReports(user);
  }

  @Public()
  @Get(':id')
  publicProfile(@Param('id') id: string) {
    return this.users.publicProfile(id);
  }
}