
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

async function getGridConfiguration(pageCount: number, maxOutputPages: number) {
    if (maxOutputPages < 1) maxOutputPages = 1;

    const layouts = [
        { cols: 3, rows: 4, pagesPerSheet: 12 },
        { cols: 3, rows: 3, pagesPerSheet: 9 },
        { cols: 2, rows: 3, pagesPerSheet: 6 },
        { cols: 2, rows: 2, pagesPerSheet: 4 },
        { cols: 1, rows: 2, pagesPerSheet: 2 },
        { cols: 1, rows: 1, pagesPerSheet: 1 },
    ];

    for (const layout of layouts) {
        const outputPages = Math.ceil(pageCount / layout.pagesPerSheet);
        if (outputPages <= maxOutputPages) {
            return layout;
        }
    }
    
    // If no layout is found, it's impossible. Calculate the minimum possible pages.
    const minPossiblePages = Math.ceil(pageCount / layouts[0].pagesPerSheet);
    throw new Error(`Cannot compress to ${maxOutputPages} pages. The minimum possible is ${minPossiblePages}. Try increasing the max page limit.`);
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const maxPagesStr = formData.get('maxPages') as string | null;
    const maxPages = maxPagesStr ? parseInt(maxPagesStr, 10) : 5;


    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const originalPdfBytes = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(originalPdfBytes);
    const originalPages = originalPdf.getPages();
    const pageCount = originalPages.length;

    const { cols, rows } = await getGridConfiguration(pageCount, maxPages);

    const compressedPdf = await PDFDocument.create();
    compressedPdf.setProducer('KTUHUB BIT Compressor');
    compressedPdf.setCreator('KTUHUB');

    let pageIndex = 0;
    while (pageIndex < pageCount) {
        const newPage = compressedPdf.addPage();
        const { width: pageWidth, height: pageHeight } = newPage.getSize();
        
        const cellWidth = pageWidth / cols;
        const cellHeight = pageHeight / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (pageIndex >= pageCount) break;

                const originalPage = originalPages[pageIndex];
                const { width: origWidth, height: origHeight } = originalPage.getSize();
                
                const scale = Math.min(cellWidth / origWidth, cellHeight / origHeight) * 0.95; // 95% to leave some margin
                
                const embeddedPage = await compressedPdf.embedPage(originalPage);

                const x = col * cellWidth + (cellWidth - origWidth * scale) / 2;
                const y = pageHeight - (row + 1) * cellHeight + (cellHeight - origHeight * scale) / 2;

                newPage.drawPage(embeddedPage, {
                    x,
                    y,
                    width: origWidth * scale,
                    height: origHeight * scale,
                });

                pageIndex++;
            }
            if (pageIndex >= pageCount) break;
        }
    }


    const pdfBytes = await compressedPdf.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '')}_compressed.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Compression error:', error);
    return NextResponse.json({ error: 'Failed to process PDF.', details: error.message }, { status: 500 });
  }
}
