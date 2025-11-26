import crypto from 'crypto';
import { buildPublicFileUrl, createPresignedUploadUrl } from '../../core/storage/s3Client';
import {
  CreateImageUploadUrlBody,
  CreateVideoUploadUrlBody
} from './upload.types';

const safeExt = (ext: string, fallback: string) => {
  const cleaned = ext.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned || fallback;
};

const makeKey = (parts: string[]) => parts.filter(Boolean).join('/');

export const uploadService = {
  createVideoUploadUrl: async (params: { userId: string } & CreateVideoUploadUrlBody) => {
    const { userId, contentType, extension } = params;
    const key = makeKey([
      'videos',
      userId,
      `${Date.now()}-${crypto.randomUUID()}.${safeExt(extension, 'mp4')}`
    ]);

    const uploadUrl = await createPresignedUploadUrl({ key, contentType });
    const fileUrl = buildPublicFileUrl(key);

    return { uploadUrl, fileUrl, key };
  },

  createImageUploadUrl: async (params: { userId: string } & CreateImageUploadUrlBody) => {
    const { userId, contentType, extension, purpose } = params;
    const folder =
      purpose === 'THUMBNAIL' ? 'thumbnails' : purpose === 'PROFILE' ? 'profile-images' : 'images';

    const key = makeKey([
      folder,
      userId,
      `${Date.now()}-${crypto.randomUUID()}.${safeExt(extension, 'jpg')}`
    ]);

    const uploadUrl = await createPresignedUploadUrl({ key, contentType });
    const fileUrl = buildPublicFileUrl(key);

    return { uploadUrl, fileUrl, key };
  }
};
