import * as cheerio from 'cheerio';

export interface QuestionPaper {
  id: string; // Will be the same as pdfUrl
  name: string;
  subjectCode: string;
  pdfUrl: string; // URL to the PDF file
  pdfDataUri?: string; // Optional: base64 data URI of the PDF content
}

const BASE_URL = "http://202.88.225.92";

async function getPdfLink(detailUrl: string): Promise<string | null> {
  try {
    const res = await fetch(detailUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    const text = await res.text();
    const $ = cheerio.load(text);
    const link = $("a[href*='bitstream']").attr('href');
    return link ? BASE_URL + link : null;
  } catch (error) {
    console.error("Error fetching PDF link:", error);
    return null;
  }
}

export async function findPapersBySubject(subjectCode: string): Promise<QuestionPaper[]> {
  if (!subjectCode) {
    return [];
  }
  const searchUrl = `${BASE_URL}/xmlui/simple-search?query=${subjectCode}`;
  
  try {
    const res = await fetch(searchUrl, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Failed to fetch search results for ${subjectCode}, status: ${res.status}`);
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = $("div.artifact-title a");
    const results: QuestionPaper[] = [];

    for (const item of items.toArray()) {
      const title = $(item).text().trim();
      const detailUrl = BASE_URL + $(item).attr('href');
      const pdfUrl = await getPdfLink(detailUrl);

      if (pdfUrl) {
        results.push({
          id: pdfUrl,
          name: title,
          subjectCode: subjectCode.toUpperCase(),
          pdfUrl: pdfUrl,
        });
      }
    }
    return results;

  } catch (error) {
    console.error(`Error in findPapersBySubject for ${subjectCode}:`, error);
    return [];
  }
}
