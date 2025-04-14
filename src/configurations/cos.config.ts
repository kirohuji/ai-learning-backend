import { registerAs } from '@nestjs/config';

export default registerAs('cos', () => ({
  secretId: process.env.COS_SECRET_ID,
  secretKey: process.env.COS_SECRET_KEY,
  region: process.env.COS_REGION || 'ap-guangzhou',
  bucket: process.env.COS_BUCKET,
  domain: process.env.COS_DOMAIN,
}));
