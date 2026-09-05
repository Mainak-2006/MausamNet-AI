import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { MediaModule } from './media/media.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MlClientModule } from './ml-client/ml-client.module';
import { ClassificationModule } from './classification/classification.module';
import { CredibilityModule } from './credibility/credibility.module';
import { DuplicatesModule } from './duplicates/duplicates.module';
import { WeatherModule } from './weather/weather.module';
import { VerificationModule } from './verification/verification.module';
import { AlertsModule } from './alerts/alerts.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { User } from './entities/user.entity';
import { Report } from './entities/report.entity';
import { Media } from './entities/media.entity';
import { Verification } from './entities/verification.entity';
import { Alert } from './entities/alert.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'mausamnet'),
        password: configService.get<string>('DB_PASSWORD', 'mausamnet123'),
        database: configService.get<string>('DB_DATABASE', 'mausamnet'),
        entities: [User, Report, Media, Verification, Alert],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ReportsModule,
    MediaModule,
    CloudinaryModule,
    MlClientModule,
    ClassificationModule,
    CredibilityModule,
    DuplicatesModule,
    WeatherModule,
    VerificationModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}