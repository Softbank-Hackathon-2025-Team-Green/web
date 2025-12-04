import { NextRequest, NextResponse } from 'next/server';
import { invokeLambda } from '@/lib/actions/lambda';

export async function POST(request: NextRequest) {
  try {
    const { functionName, payload, useIAM } = await request.json();

    const result = await invokeLambda({ functionName, payload, useIAM: useIAM || false });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not configured') ? 500 : 400 }
      );
    }

    return NextResponse.json({
      statusCode: result.statusCode,
      executedVersion: result.executedVersion,
      body: result.body,
      functionError: result.functionError,
    });
  } catch (error) {
    console.error('Error invoking Lambda:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
