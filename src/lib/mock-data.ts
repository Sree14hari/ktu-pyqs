
'use server';

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import * as cheerio from 'cheerio';

export interface QuestionPaper {
  id: string; 
  name: string;
  subjectCode: string;
  pdfUrl: string;
  pdfDataUri?: string; 
}

const BASE_URL = "http://202.88.225.92";

let serverStatus: 'up' | 'down' | 'checking' = 'checking';
let statusPromise: Promise<boolean> | null = null;

async function checkServerStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    const response = await fetch(BASE_URL, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Server status check failed:", error);
    return false;
  }
}

export async function getServerStatus(): Promise<'up' | 'down' | 'checking'> {
    if (serverStatus === 'checking' && !statusPromise) {
        statusPromise = checkServerStatus();
        const isUp = await statusPromise;
        serverStatus = isUp ? 'up' : 'down';
        statusPromise = null; 
    }
    return serverStatus;
}

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


export async function findResearchPapers(query: string): Promise<QuestionPaper[]> {
  if (!query) {
    return [];
  }
  const searchUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    query
  )}&start=0&max_results=10&sortBy=relevance&sortOrder=descending`;

  try {
    const response = await axios.get(searchUrl, { responseType: 'text' });
    const data = await parseStringPromise(response.data);
    
    if (!data.feed || !data.feed.entry) {
        return [];
    }
    
    const entries = data.feed.entry;

    const results: QuestionPaper[] = entries.map((entry: any) => {
        const id = entry.id[0];
        const title = entry.title[0].trim().replace(/\s\s+/g, ' ');
        let pdfUrl = '';

        if (Array.isArray(entry.link)) {
            for (const link of entry.link) {
                if (link.$.title === 'pdf') {
                    pdfUrl = link.$.href;
                    break;
                }
            }
        }
        // Fallback if the specific 'pdf' title link isn't found
        if (!pdfUrl && id.includes("arxiv.org/abs/")) {
            pdfUrl = id.replace("/abs/", "/pdf/") + ".pdf";
        }
        
        return {
            id,
            name: title,
            subjectCode: query,
            pdfUrl,
        };
    }).filter((p: { pdfUrl: string; }) => p.pdfUrl);

    return results;

  } catch (error) {
    console.error(`Error in findResearchPapers for query "${query}":`, error);
    return [];
  }
}


export async function fetchPdfAsDataUri(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:application/pdf;base64,${base64}`;
}
