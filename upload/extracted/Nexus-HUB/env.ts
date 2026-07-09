export const ENV = {
  ownerOpenId: process.env.OWNER_OPENID || 'nexus-owner',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/nexus_hub',
  s3Bucket: process.env.S3_BUCKET || 'nexus-audit',
  s3Region: process.env.S3_REGION || 'us-east-1',
};
