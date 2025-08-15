"use client";

import { useState } from 'react';
import { orientQuestionPaperPages } from '@/ai/flows/orient-pages';
import { QuestionPaper, findPapersBySubject } from '@/lib/mock-data';
import { dataUriToUint8Array } from '@/lib/pdf-utils';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, Download, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [subjectCode, setSubjectCode] = useState('');
  const [searchResults, setSearchResults] = useState<QuestionPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode) return;
    
    setIsSearching(true);
    setError(null);
    setGeneratedPdfUrl(null);
    setSelectedPapers(new Set());
    setSearchResults([]);

    try {
      const results = await findPapersBySubject(subjectCode);
      if (results.length === 0) {
        setError(`No question papers found for subject code "${subjectCode}".`);
      }
      setSearchResults(results);
    } catch (err) {
      setError("Failed to fetch question papers. The source might be down or the subject code is incorrect.");
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectionChange = (paperId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedPapers);
    if (isSelected) {
      newSelection.add(paperId);
    } else {
      newSelection.delete(paperId);
    }
    setSelectedPapers(newSelection);
    setGeneratedPdfUrl(null);
  };

  const handleGeneratePdf = async () => {
    if (selectedPapers.size === 0) {
      setError("Please select at least one paper to generate a PDF.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedPdfUrl(null);

    try {
      const papersToMerge = searchResults.filter(p => selectedPapers.has(p.id));
      const paperUrls = papersToMerge.map(p => p.pdfUrl);
      
      const result = await orientQuestionPaperPages({ pdfUrls: paperUrls });
      const mergedPdfUri = result.mergedPdfDataUri;
      
      const blob = new Blob([dataUriToUint8Array(mergedPdfUri)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);
      toast({
        title: "PDF Generated Successfully",
        description: "Your merged PDF is ready for download.",
      });

    } catch (e) {
      setError("Failed to generate PDF. Please try again.");
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error Generating PDF",
        description: "An unexpected error occurred while creating your PDF.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = `${subjectCode.toUpperCase()}_PYQs_merged.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <header className="flex flex-col items-center justify-center text-center py-8">
          <BookOpen className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">PYQ Access</h1>
          <p className="mt-2 text-lg text-muted-foreground">Your one-stop solution for KTU question papers.</p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Find Question Papers
            </CardTitle>
            <CardDescription>Enter a subject code to begin your search (e.g., CS301, MA201).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Enter Subject Code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                className="text-base"
                aria-label="Subject Code"
              />
              <Button type="submit" disabled={isSearching || !subjectCode}>
                {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {(isSearching || searchResults.length > 0) && (
          <Card className="mt-8 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Search Results
              </CardTitle>
              <CardDescription>Select the papers you want to combine and download.</CardDescription>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-2">
                      <Skeleton className="h-6 w-6 rounded-sm" />
                      <Skeleton className="h-6 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((paper) => (
                    <div key={paper.id} className="flex items-center space-x-3 p-2 rounded-md transition-colors hover:bg-muted">
                      <Checkbox
                        id={paper.id}
                        checked={selectedPapers.has(paper.id)}
                        onCheckedChange={(checked) => handleSelectionChange(paper.id, !!checked)}
                        aria-labelledby={`label-${paper.id}`}
                      />
                      <Label htmlFor={paper.id} id={`label-${paper.id}`} className="text-base font-normal cursor-pointer flex-grow">
                        {paper.subjectCode} - {paper.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-4 bg-slate-50 p-4 rounded-b-xl border-t">
               <Button onClick={handleGeneratePdf} disabled={isGenerating || selectedPapers.size === 0}>
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />}
                {isGenerating ? 'Generating PDF...' : `Generate PDF (${selectedPapers.size} selected)`}
              </Button>
              {generatedPdfUrl && (
                 <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2" />
                  Download Merged PDF
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  );
}
