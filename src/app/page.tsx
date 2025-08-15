
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
import { BookOpen, Search, Download, FileText, Loader2, AlertCircle, CheckSquare, Github, Linkedin, Instagram, Mail } from 'lucide-react';

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

  const handleSelectAll = () => {
    if (selectedPapers.size === searchResults.length) {
      // Deselect all
      setSelectedPapers(new Set());
    } else {
      // Select all
      const allPaperIds = new Set(searchResults.map(p => p.id));
      setSelectedPapers(allPaperIds);
    }
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

  const allSelected = searchResults.length > 0 && selectedPapers.size === searchResults.length;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-body text-foreground">
      <main className="flex-grow container mx-auto max-w-4xl p-4 md:p-8">
        <header className="flex flex-col items-center justify-center text-center py-6 md:py-8">
          <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-primary mb-3" />
          <h1 className="text-3xl md:text-5xl font-bold text-primary tracking-tight">PYQ Access</h1>
          <p className="mt-2 text-md md:text-lg text-muted-foreground font-medium">Your one-stop solution for KTU question papers.</p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full shadow-lg rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <Search className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Find Question Papers
            </CardTitle>
            <CardDescription className="text-sm md:text-base">Enter a subject code to begin (e.g., CS301, MA201).</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Enter Subject Code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                className="text-base md:text-lg h-12 rounded-lg shadow-inner focus:ring-2 focus:ring-primary/80 transition-all"
                aria-label="Subject Code"
              />
              <Button type="submit" disabled={isSearching || !subjectCode} className="h-12 w-full sm:w-auto rounded-lg text-base md:text-lg bg-primary/90 hover:bg-primary transition-all">
                {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {(isSearching || searchResults.length > 0) && (
          <Card className="mt-8 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Search Results
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Select the papers you want to combine and download.</CardDescription>
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
                    <div key={paper.id} className="flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-muted">
                      <Checkbox
                        id={paper.id}
                        checked={selectedPapers.has(paper.id)}
                        onCheckedChange={(checked) => handleSelectionChange(paper.id, !!checked)}
                        aria-labelledby={`label-${paper.id}`}
                        className="h-5 w-5"
                      />
                      <Label htmlFor={paper.id} id={`label-${paper.id}`} className="text-sm md:text-base font-normal cursor-pointer flex-grow">
                        {paper.subjectCode} - {paper.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 p-4 rounded-b-2xl border-t">
              {!isSearching && searchResults.length > 0 && (
                <Button onClick={handleSelectAll} variant="secondary" className="w-full sm:w-auto rounded-lg">
                  <CheckSquare className="mr-2" />
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              )}
               <Button onClick={handleGeneratePdf} disabled={isGenerating || selectedPapers.size === 0} className="w-full sm:w-auto rounded-lg">
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />}
                {isGenerating ? 'Generating...' : `Generate PDF (${selectedPapers.size})`}
              </Button>
              {generatedPdfUrl && (
                 <Button onClick={handleDownload} variant="outline" className="w-full sm:w-auto rounded-lg">
                  <Download className="mr-2" />
                  Download Merged PDF
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </main>
       <footer className="w-full py-6">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row justify-between items-center gap-4 px-4 text-center md:text-left">
          <div className="flex items-center gap-4">
              <a href="https://github.com/Sree14hari" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-6 w-6" />
              </a>
              <a href="https://www.linkedin.com/in/sree14hari" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-6 w-6" />
              </a>
              <a href="https://www.instagram.com/s_ree.har_i" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-6 w-6" />
              </a>
          </div>
          <a href="https://github.com/Sree14hari" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-lg">
              <Mail className="mr-2 h-4 w-4"/>
              Give Feedback
            </Button>
          </a>
          <p className="text-sm text-muted-foreground">
            Built with ❤️ by Sreehari
          </p>
        </div>
      </footer>
    </div>
  );
 