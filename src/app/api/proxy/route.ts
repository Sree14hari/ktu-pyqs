
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    const pdfResponse = await fetch(url);

    if (!pdfResponse.ok) {
      return new NextResponse(`Failed to fetch PDF: ${pdfResponse.statusText}`, {
        status: pdfResponse.status,
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="proxied.pdf"`);
    // Cache on Vercel's Edge Network for 24 hours (86400 seconds)
    // and allow serving stale content for an hour while revalidating.
    headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    
    return new NextResponse(pdfResponse.body, { headers });

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Error fetching PDF through proxy', { status: 500 });
  }
}

    