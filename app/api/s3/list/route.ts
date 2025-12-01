import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

    if (!bucket) {
      return NextResponse.json(
        { error: 'S3 bucket name not configured' },
        { status: 500 }
      );
    }

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    return NextResponse.json({
      success: true,
      items: response.Contents?.map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
      })) || [],
    });
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
