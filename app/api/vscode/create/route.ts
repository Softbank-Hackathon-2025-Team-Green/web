import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

export async function POST(request: NextRequest) {
  try {
    const { path, isDirectory, userId } = await request.json();
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

    if (!bucket) {
      return NextResponse.json(
        { error: 'S3 bucket name not configured' },
        { status: 500 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: 'Path not provided' },
        { status: 400 }
      );
    }

    if (isDirectory) {
      // Create a folder by creating a .keep file inside it
      const key = `users/${userId}/functions/${path}/.keep`;
      
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: '',
        ContentType: 'text/plain',
      });

      await s3Client.send(command);

      return NextResponse.json({
        success: true,
        path,
        type: 'folder',
      });
    } else {
      // Create an empty file
      const key = `users/${userId}/functions/${path}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: '',
        ContentType: 'text/plain',
      });

      await s3Client.send(command);

      return NextResponse.json({
        success: true,
        path,
        type: 'file',
      });
    }
  } catch (error) {
    console.error('Error creating file/folder in S3:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
