import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthedUser } from '../auth/types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(user: AuthedUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        phone: true,
        city: true,
        state: true,
        role: true,
        credibilityScore: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(user: AuthedUser, dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { id: user.id },
      data: {
        name: dto.name,
        username: dto.username,
        phone: dto.phone,
        city: dto.city,
        state: dto.state,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        phone: true,
        city: true,
        state: true,
        role: true,
        credibilityScore: true,
        createdAt: true,
      },
    });
  }

  async publicProfile(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        city: true,
        state: true,
        credibilityScore: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
    });
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  async myReports(user: AuthedUser) {
    return this.prisma.report.findMany({
      where: { authorId: user.id },
      orderBy: { reportedAt: 'desc' },
      take: 20,
      include: {
        media: true,
        author: {
          select: { id: true, name: true, avatarUrl: true, credibilityScore: true },
        },
      },
    });
  }
}