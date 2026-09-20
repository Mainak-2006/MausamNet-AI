import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaType } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthedUser } from '../auth/types';
import { MediaService } from './media.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = /^(image\/(jpeg|png|webp|gif|heic)|video\/(mp4|webm|quicktime))$/;

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.test(file.mimetype)) {
          cb(new BadRequestException('Unsupported file type'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: any,
    @CurrentUser() user: AuthedUser,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const result = await this.media.upload(file, user.id);
    const record = await this.media.saveRecord({
      url: result.url,
      publicId: result.publicId,
      type: result.type as MediaType,
      uploaderId: user.id,
    });
    return { url: result.url, mediaId: record.id, type: record.type };
  }
}