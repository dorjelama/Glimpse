import { Injectable } from '@nestjs/common';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { join, basename } from 'path';

@Injectable()
export class StorageService {
  private readonly useR2: boolean;
  private readonly client?: S3Client;
  private readonly bucket?: string;

  constructor() {
    this.useR2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID;

    if (this.useR2) {
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
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.useR2) {
      const filename = basename(key);
      await writeFile(join(process.cwd(), 'uploads', filename), buffer);
      return `/uploads/${filename}`;
    }

    const upload = new Upload({
      client: this.client!,
      params: { Bucket: this.bucket!, Key: key, Body: buffer, ContentType: contentType },
    });
    await upload.done();
    return this.publicUrl(key);
  }

  async delete(key: string): Promise<void> {
    if (!this.useR2) {
      await unlink(join(process.cwd(), 'uploads', key)).catch(() => {});
      return;
    }
    await this.client!.send(new DeleteObjectCommand({ Bucket: this.bucket!, Key: key }));
  }

  async getReadStream(key: string): Promise<Readable> {
    if (!this.useR2) {
      return createReadStream(join(process.cwd(), 'uploads', key));
    }
    const resp = await this.client!.send(new GetObjectCommand({ Bucket: this.bucket!, Key: key }));
    return resp.Body as Readable;
  }

  publicUrl(key: string): string {
    if (!this.useR2) return `/uploads/${basename(key)}`;
    if (process.env.R2_PUBLIC_DOMAIN) return `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
    return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
  }

  extractKey(url: string): string | null {
    if (!this.useR2) {
      // Dev: local URLs are /uploads/<filename>
      if (url.startsWith('/uploads/')) return basename(url);
      return null;
    }

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
