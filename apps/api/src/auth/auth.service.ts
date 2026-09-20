import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthedUser } from './types';

@Injectable()
export class AuthService {
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
    return profile;
  }
}