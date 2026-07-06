import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'jakarta-pulse-reports';

export async function uploadImageToGCS(buffer: Buffer, originalName: string): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const ext = originalName.split('.').pop() || 'jpg';
  const fileName = `reports/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    },
    public: true, // Assuming we want it to be readable, or omit if private
  });

  // Return the public URL
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}
