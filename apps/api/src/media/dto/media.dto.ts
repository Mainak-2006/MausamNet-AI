import { IsUUID, IsString, IsIn } from 'class-validator';

export class UploadMediaDto {
  @IsUUID()
  reportId: string;

  @IsString()
  @IsIn(['photo', 'video'])
  type: string;
}
