import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../entities/media.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MulterFile } from '../types/multer-file';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async upload(
    file: MulterFile,
    reportId: string,
    type: string,
  ): Promise<Media> {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpg, png, gif, mp4, webm',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const { url, publicId } = await this.cloudinaryService.uploadFile(
      file,
      'reports',
    );

    const media = this.mediaRepository.create({
      reportId,
      type,
      url,
      cloudinaryId: publicId,
    });

    return this.mediaRepository.save(media);
  }

  async findByReportId(reportId: string): Promise<Media[]> {
    return this.mediaRepository.find({ where: { reportId } });
  }

  async remove(id: string): Promise<{ message: string }> {
    const media = await this.mediaRepository.findOne({ where: { id } });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.cloudinaryService.deleteFile(media.cloudinaryId);
    await this.mediaRepository.remove(media);

    return { message: 'Media deleted successfully' };
  }
}