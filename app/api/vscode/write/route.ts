import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { path, content, userId } = await request.json();
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

    if (!bucket) {
      return NextResponse.json(
        { error: 'S3 bucket name not configured' },
        { status: 500 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: 'File path not provided' },
        { status: 400 }
      );
    }

    const key = `users/${userId}/functions/${path}`;

    // Determine content type based on file extension
    const extension = path.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      js: 'application/javascript',
      jsx: 'application/javascript',
      ts: 'application/typescript',
      tsx: 'application/typescript',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      md: 'text/markdown',
      txt: 'text/plain',
      py: 'text/x-python',
      java: 'text/x-java',
      cpp: 'text/x-c++src',
      c: 'text/x-csrc',
    };

    const contentType = contentTypeMap[extension || ''] || 'text/plain';

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      path,
      key,
    });
  } catch (error) {
    console.error('Error writing file to S3:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
