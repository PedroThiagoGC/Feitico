import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../../services/supabase.service';

type UploadImagePayload = {
  folder?: string;
  fileName?: string;
  mimeType?: string;
  dataBase64: string;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadImage(payload: UploadImagePayload) {
    const folder = payload.folder || 'general';
    const mimeType = payload.mimeType || 'image/jpeg';

    if (!payload.dataBase64) {
      throw new BadRequestException('Image payload is required');
    }

    const cleanBase64 = payload.dataBase64.replace(/^data:[^;]+;base64,/, '');
    const binary = Buffer.from(cleanBase64, 'base64');

    if (binary.length === 0) {
      throw new BadRequestException('Invalid image payload');
    }

    if (binary.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Image too large (max 5MB)');
    }

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const extension = this.getExtension(mimeType, payload.fileName);
    const path = `${folder}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error } = await this.supabaseService
      .getClient()
      .storage
      .from('salon-images')
      .upload(path, binary, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      this.logger.error('Error uploading image', error);
      throw new BadRequestException('Failed to upload image');
    }

    const { data } = this.supabaseService
      .getClient()
      .storage
      .from('salon-images')
      .getPublicUrl(path);

    return {
      url: data.publicUrl,
      path,
    };
  }

  private getExtension(mimeType: string, fileName?: string) {
    const fromName = fileName?.split('.').pop()?.toLowerCase();
    if (fromName) {
      return fromName;
    }

    const lookup: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
    };

    return lookup[mimeType] || 'jpg';
  }
}
