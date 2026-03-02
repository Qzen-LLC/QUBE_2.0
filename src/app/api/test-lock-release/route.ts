import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Lock release test endpoint called');
    
    const body = await request.json();
    console.log('🧪 [TEST] Request body:', body);
    
    const { useCaseId, lockType, scope } = body;
    
    if (!useCaseId || !lockType || !scope) {
      return NextResponse.json({ 
        error: 'Missing required fields: useCaseId, lockType, scope' 
      }, { status: 400 });
    }
    
    console.log('🧪 [TEST] Testing lock release with:', { useCaseId, lockType, scope });
    
    // Call the actual lock release endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/locks/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: JSON.stringify({ useCaseId, lockType, scope })
    });
    
    const result = await response.json();
    console.log('🧪 [TEST] Lock release result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Lock release test completed',
      result: result
    });
    
  } catch (error) {
    console.error('🧪 [TEST] Error in lock release test:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
