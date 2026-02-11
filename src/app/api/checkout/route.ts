import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

interface CheckoutRequestBody {
  productId?: string;
  quantity?: number;
}

export async function POST(request: NextRequest) {
  // Use modern Sentry span API instead of deprecated getCurrentHub().getScope().getTransaction()
  return await Sentry.startSpan(
    {
      name: 'POST /api/checkout',
      op: 'http.server',
      attributes: {
        'http.method': 'POST',
        'http.route': '/api/checkout',
      },
    },
    async () => {
      try {
        // Parse request body
        const body: CheckoutRequestBody = await request.json();
        const { productId, quantity } = body;

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const forceError = searchParams.get('forceError') === '1';
        const slowMode = searchParams.get('slow') === '1';

        // Get userId from headers or custom attribute (simulating authentication)
        // In a real app, this would come from session/auth middleware
        const userId = request.headers.get('x-user-id') || 'user_123';

        // Add context to Sentry
        Sentry.setTag('user_id', userId);
        Sentry.setContext('checkout', {
          productId,
          quantity,
          forceError,
          slowMode,
        });

        // Simulate slow mode if requested
        if (slowMode) {
          await Sentry.startSpan(
            {
              name: 'slow_processing',
              op: 'task',
            },
            async () => {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          );
        }

        // Force error if requested (for testing Sentry error capture)
        if (forceError) {
          throw new Error('Forced error for testing Sentry integration');
        }

        // Validate request
        if (!productId || !quantity || quantity <= 0) {
          return NextResponse.json(
            { error: 'Invalid productId or quantity' },
            { status: 400 }
          );
        }

        // Simulate checkout processing
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await Sentry.startSpan(
          {
            name: 'process_checkout',
            op: 'task',
          },
          async () => {
            // Simulate database/payment processing
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        );

        // Return success response
        return NextResponse.json({
          success: true,
          orderId,
          productId,
          quantity,
          userId,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        // Capture error with Sentry
        Sentry.captureException(error);
        
        // Return error response
        return NextResponse.json(
          { 
            error: error instanceof Error ? error.message : 'Failed to process checkout',
            success: false,
          },
          { status: 500 }
        );
      }
    }
  );
}