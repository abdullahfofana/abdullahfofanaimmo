import app from '@/backend/hono';

const handler = async (request: Request) => {
  try {
    const response = await app.fetch(request);

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // Only warn if it's not a 404 (404s for favicon etc are normal)
      if (response.status !== 404) {
        console.warn('[API Route] Non-JSON response detected:', contentType, response.status);
      }
    }

    return response;
  } catch (error) {
    console.error('[API Route] Error handling request:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const GET = handler;
export const POST = handler;
