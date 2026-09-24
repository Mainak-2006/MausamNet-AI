import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_BUCKET = 'media';

export interface MediaUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private client(): SupabaseClient {
    if (this.supabase) return this.supabase;
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new Error('Supabase storage is not configured');
    }
    this.supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.supabase;
  }

  private bucket(): string {
    return this.config.get<string>('SUPABASE_STORAGE_BUCKET') ?? DEFAULT_BUCKET;
  }

  private async ensureBucket(): Promise<void> {
    const storage = this.client().storage;
    const { data, error } = await storage.getBucket(this.bucket());
    if (error || !data) {
      const { error: createError } = await storage.createBucket(this.bucket(), {
        public: true,
      });
      if (createError) {
        this.logger.error(
          `Failed to create storage bucket "${this.bucket()}": ${createError.message}`,
        );
      }
    }
  }

  async upload(
    file: MediaUploadFile,
    uploaderId: string,
  ): Promise<{
    id: string;
    url: string;
    publicId: string;
    type: MediaType;
  }> {
    const type: MediaType = file.mimetype.startsWith('video/')
      ? MediaType.VIDEO
      : MediaType.IMAGE;
    const ext = path.extname(file.originalname).toLowerCase() ||
      MIME_EXTENSIONS[file.mimetype] ||
      '';
    const objectId = `${uploaderId}/${randomUUID()}${ext}`;

    await this.ensureBucket();
    const { error } = await this.client()
      .storage.from(this.bucket())
      .upload(objectId, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw error;
    }

    const { data } = this.client()
      .storage.from(this.bucket())
      .getPublicUrl(objectId);

    return {
      id: objectId,
      url: data.publicUrl,
      publicId: objectId,
      type,
    };
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