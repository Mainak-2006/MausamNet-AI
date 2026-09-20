import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: { buffer: Buffer },
    uploaderId: string,
  ): Promise<{ id: string; url: string; publicId: string; type: MediaType }> {
    try {
      const result = (await new Promise<UploadApiResponse | undefined>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'mausamnet', resource_type: 'auto' },
            (error, response) =>
              error ? reject(error) : resolve(response),
          );
          stream.end(file.buffer);
        },
      )) as UploadApiResponse;
      if (!result) throw new Error('Cloudinary returned no result');

      const type: MediaType =
        result.resource_type === 'video' ? MediaType.VIDEO : MediaType.IMAGE;

      return { id: result.public_id, url: result.secure_url, publicId: result.public_id, type };
    } catch (err) {
      this.logger.error(`Cloudinary upload failed: ${String(err)}`);
      throw err;
    }
  }

  async saveRecord(data: {
    url: string;
    publicId: string;
    type: MediaType;
    uploaderId: string;
  }) {
    return this.prisma.media.create({
      data: {
        url: data.url,
        publicId: data.publicId,
        type: data.type,
        uploaderId: data.uploaderId,
      },
    });
  }
}