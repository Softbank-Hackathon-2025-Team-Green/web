import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

export async function POST(request: NextRequest) {
  try {
    const { path, userId } = await request.json();
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

    console.log('List API - path:', path, 'userId:', userId);

    if (!bucket) {
      return NextResponse.json(
        { error: 'S3 bucket name not configured' },
        { status: 500 }
      );
    }

    const prefix = path 
      ? `users/${userId}/functions/${path}/`
      : `users/${userId}/functions/`;

    console.log('List API - S3 prefix:', prefix);

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      // Remove Delimiter to get all files recursively
    });

    const response = await s3Client.send(command);
    console.log('List API - S3 response:', { 
      contents: response.Contents?.length || 0,
      keys: response.Contents?.map(c => c.Key) || []
    });

    // Extract all files and infer folders from paths
    const allItems: Array<{ name: string; path: string; type: 'file' | 'folder'; size?: number; lastModified?: Date }> = [];
    const folderPaths = new Set<string>();

    // Process files
    (response.Contents || [])
      .filter(item => item.Key !== prefix && !item.Key?.endsWith('/')) // Exclude prefix and directory markers
      .forEach(item => {
        const relativePath = item.Key?.replace(prefix, '') || '';
        
        // Add file
        allItems.push({
          name: relativePath.split('/').pop() || relativePath,
          path: relativePath,
          type: 'file',
          size: item.Size,
          lastModified: item.LastModified,
        });

        // Add all parent folders
        const parts = relativePath.split('/');
        for (let i = 1; i < parts.length; i++) {
          const folderPath = parts.slice(0, i).join('/');
          folderPaths.add(folderPath);
        }
      });

    // Add folders
    folderPaths.forEach(folderPath => {
      allItems.push({
        name: folderPath.split('/').pop() || folderPath,
        path: folderPath,
        type: 'folder',
      });
    });

    console.log('List API - processed items:', allItems);

    return NextResponse.json({
      success: true,
      items: allItems,
    });
  } catch (error) {
    console.error('Error listing S3 directory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
