export interface QuestionPaper {
  id: string;
  name: string; // e.g., "April 2021"
  subjectCode: string;
  // A real base64 encoded PDF data URI. This is a sample 1-page PDF.
  pdfDataUri: string;
}

// A sample one-page PDF, base64 encoded.
const samplePdfDataUri = "data:application/pdf;base64,JVBERi0xLjcKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykgL1N0cnVjdFRyZWVSb290IDQgMCBSL01hcmtJbmZvPDwvTWFya2VkIHRydWU+Pj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbIDMgMCBSIF0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA1IDAgUj4+L1Byb2NTZXRbL1BERi9UZXh0L0ltYWdlQi9JbWFnZUMvSW1hZ2VJXSAvTWVkaWFCb3hbIDAgMCA2MTIgNzkyXSAvQ29udGVudHMgNiAwIFIvR3JvdXA8PC9UeXBlL0dyb3VwL1MvVHJhbnNwYXJlbmN5L0NTL0RldmljZVJHQj4+L1RhYnMvUy9TdHJ1Y3RQYXJlbnRzIDA+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL1N0cnVjdFRyZWVSb290L1JvbGVNYXA8PC9Eb2N1bWVudC9Eb2N1bWVudC9QYXJhL1AgL1NlY3QvU2VjdD4+L0s8PC9SZXN1bHRzWzxkOD4zYWM0OWE1OWYyNGU5MmE3MmE0MTc5YjFhYzQ4ODJjPl0vUm9sZS9Eb2N1bWVudC9QYXJlbnQxL1R5cGUvUGFyZW50VHJlZT4+L1BhcmVudFRyZWUgNyAwIFI+PgplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UcnVlVHlwZS9OYW1lP0cxK1RpbWVzTmV3Um9tYW4vQmFzZUZvbnQvVGltZXMtUm9tYW4vRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjYgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCAzOT4+CnN0cmVhbQp4nE2LSwqAMBAF7/KKpQdІCqIILi5c6h5C/P+LBH2jicmEZMYdw0odmOF0pYo0L52yK1L6BikFm8J6zGgOs+zV8L2G46QQ+5CakpzTM9z8p3fX2h38i8ofVwYgnx9+CR8KZW5kc3RyZWFtCmVuZG9iago3IDAgb2JqCls4IDAgUl0KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MDUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDk5IDAwMDAwIG4gCjAwMDAwMDAxNDkgMDAwMDAgbiAKMDAwMDAwMDI5NCAwMDAwMCBuIAowMDAwMDAwNDM5IDAwMDAwIG4gCjAwMDAwMDA1MjIgMDAwMDAgbiAKMDAwMDAwMDczOCAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOC9Sb290IDEgMCBSL0luZm88PC9DcmVhdGlvbkRhdGUoRDoyMDE4MDgwODEyMjY0NCkvTW9kRGF0ZShEOjoyMDE4MDgwODEyMjY0NCkvUHJvZHVjZXIoUHJpbmNlIDEwLjApL0F1dGhvcihNaWtlIFBhbHVrKS9UaXRsZShzYW1wbGUpPj4vSURbPGQ4M2FjNDlhNTlmMjRlOTJhNzJhNDE3OWIxYWM0ODgyYz48ZDgzYWM0OWE1OWYyNGU5MmE3MmE0MTc5YjFhYzQ4ODJjPl0+PgpzdGFydHhyZWYKNzUxCiUlRU9GCg==";

const allPapers: QuestionPaper[] = [
  { id: 'cs301-apr-21', name: 'April 2021', subjectCode: 'CS301', pdfDataUri: samplePdfDataUri },
  { id: 'cs301-dec-20', name: 'December 2020', subjectCode: 'CS301', pdfDataUri: samplePdfDataUri },
  { id: 'cs301-apr-20', name: 'April 2020 (Supplementary)', subjectCode: 'CS301', pdfDataUri: samplePdfDataUri },
  { id: 'cs303-apr-21', name: 'April 2021', subjectCode: 'CS303', pdfDataUri: samplePdfDataUri },
  { id: 'cs303-dec-20', name: 'December 2020', subjectCode: 'CS303', pdfDataUri: samplePdfDataUri },
  { id: 'ma201-jul-22', name: 'July 2022', subjectCode: 'MA201', pdfDataUri: samplePdfDataUri },
  { id: 'ma201-apr-22', name: 'April 2022', subjectCode: 'MA201', pdfDataUri: samplePdfDataUri },
  { id: 'ec312-may-19', name: 'May 2019', subjectCode: 'EC312', pdfDataUri: samplePdfDataUri },
];

export function findPapersBySubject(subjectCode: string): QuestionPaper[] {
  if (!subjectCode) {
    return [];
  }
  return allPapers.filter(paper => paper.subjectCode.toLowerCase() === subjectCode.toLowerCase());
}
