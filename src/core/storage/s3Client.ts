import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let cachedClient: S3Client | null = null;

// Lazy singleton S3 client to reuse connections.
export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.STORAGE_S3_ENDPOINT;
  const region = process.env.STORAGE_S3_REGION ?? 'us-east-1';
  const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY;

  cachedClient = new S3Client({
    region,
    endpoint,
    forcePathStyle: true, // Better compatibility with S3-compatible providers (e.g., R2, MinIO).
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined
  });

  return cachedClient;
}

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getS3Client();
  const bucket = process.env.STORAGE_S3_BUCKET;
  if (!bucket) {
    throw new Error('Missing STORAGE_S3_BUCKET');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: params.expiresInSeconds ?? 900 });
  return signedUrl;
}

export function buildPublicFileUrl(key: string): string {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (!base) {
    // TODO: Validate STORAGE_PUBLIC_BASE_URL in production and fail fast if missing.
    return key;
  }
  return `${base.replace(/\/$/, '')}/${key}`;
}
