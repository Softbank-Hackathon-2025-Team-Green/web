import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function DELETE(request: NextRequest) {
  try {
    const { path, userId } = await request.json();
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

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      path,
    });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
