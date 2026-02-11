import * as Sentry from '@sentry/nextjs';

interface CheckoutRequest {
  productId: string;
  quantity: number;
}

export async function POST(request: Request) {
  // Use modern Sentry v8/v9 API to get and update active span
  const activeSpan = Sentry.getActiveSpan();
  
  // Update span name using modern API
  if (activeSpan) {
    const rootSpan = Sentry.getRootSpan(activeSpan);
    if (rootSpan) {
      rootSpan.updateName('POST /api/checkout');
    }
  }

  try {
    const body = await request.json() as CheckoutRequest;
    const { productId, quantity } = body;
    
    // Get userId from headers or session (placeholder)
    const userId = request.headers.get('x-user-id') || 'user_123';
    
    // Get query parameters
    const url = new URL(request.url);
    const forceError = url.searchParams.get('forceError') === '1';
    const slowMode = url.searchParams.get('slow') === '1';

    // Handle force error mode
    if (forceError) {
      throw new Error('Forced error in checkout');
    }

    // Handle slow mode
    if (slowMode) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Process checkout (placeholder logic)
    const orderId = `order_${Date.now()}`;
    
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        userId,
        productId,
        quantity,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    Sentry.captureException(error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process checkout' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}