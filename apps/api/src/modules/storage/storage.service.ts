import { Injectable } from '@nestjs/common';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME!;
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });
    await upload.done();
    return this.publicUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getReadStream(key: string): Promise<Readable> {
    const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return resp.Body as Readable;
  }

  publicUrl(key: string): string {
    if (process.env.R2_PUBLIC_DOMAIN) {
      return `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
    }
    return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
  }

  extractKey(url: string): string | null {
    if (!url.startsWith('https://')) return null;

    if (process.env.R2_PUBLIC_DOMAIN) {
      const base = `https://${process.env.R2_PUBLIC_DOMAIN}/`;
      if (url.startsWith(base)) return url.slice(base.length);
    }

    const base = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/`;
    if (url.startsWith(base)) return url.slice(base.length);

    return null;
  }
}
