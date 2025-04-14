import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as COS from 'cos-nodejs-sdk-v5';

interface CosConfig {
  secretId: string;
  secretKey: string;
  region: string;
  bucket: string;
  domain: string;
}

@Injectable()
export class CosService {
  private cos: COS;
  private config: CosConfig;

  constructor(private configService: ConfigService) {
    const config = this.configService.get<CosConfig>('cos');
    if (!config) {
      throw new Error('COS configuration is missing');
    }
    this.config = config;
    this.cos = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    });
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
          Body: file.buffer,
          ContentLength: file.size,
        },
        (err: COS.CosError | null, data: COS.PutObjectResult) => {
          if (err) {
            reject(new Error(err.message || 'Failed to upload file'));
          } else {
            resolve(`${this.config.domain}/${data.Location}`);
          }
        },
      );
    });
  }

  async getFile(key: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.cos.getObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
        },
        (err: COS.CosError | null, data: COS.GetObjectResult) => {
          if (err) {
            reject(new Error(err.message || 'Failed to get file'));
          } else {
            resolve(data.Body);
          }
        },
      );
    });
  }

  async deleteFile(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: this.config.bucket,
          Region: this.config.region,
          Key: key,
        },
        (err: COS.CosError | null) => {
          if (err) {
            reject(new Error(err.message || 'Failed to delete file'));
          } else {
            resolve();
          }
        },
      );
    });
  }
}
