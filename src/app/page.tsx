
"use client";

import { useState, useEffect, useRef } from 'react';
import { preparePdfUrls } from '@/ai/flows/prepare-pdf-urls';
import { QuestionPaper, findPapersBySubject, findResearchPapers, getServerStatus } from '@/lib/mock-data';
import { dataUriToUint8Array, mergePdfs } from '@/lib/pdf-utils';
import { useToast } from "@/hooks/use-toast";
import { useHistory } from '@/hooks/use-history';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Search, Download, Loader2, AlertCircle, CheckSquare, Github, Linkedin, Instagram, Heart, X, MessageSquare, ExternalLink, TreePine, Snowflake, Gift, NotebookText } from 'lucide-react';
import { ChristmasTheme } from '@/components/ui/christmas-theme';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { IconSquareRoundedX } from '@tabler/icons-react';


const pdfCache = new Map<string, string>();

async function fetchPdfAsDataUriClient(url: string, signal?: AbortSignal): Promise<string> {
    if (pdfCache.has(url)) {
        return pdfCache.get(url)!;
    }
    const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, { signal });
    if (!response.ok) {
        throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    pdfCache.set(url, dataUri);
    return dataUri;
}

const loadingStates = [
  { text: "Warming up the servers..." },
  { text: "Finding the right papers..." },
  { text: "Fetching papers from the archives..." },
  { text: "Combining papers into a single PDF..." },
  { text: "Adding some final touches..." },
  { text: "Your PDF is almost ready!" },
];


export default function Home() {
  const [subjectCode, setSubjectCode] = useState('');
  const [searchResults, setSearchResults] = useState<QuestionPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [serverStatus, setServerStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const abortControllerRef = useRef<AbortController | null>(null);
  const { addHistoryItem } = useHistory();
  const [searchType, setSearchType] = useState<'pyq' | 'research'>('pyq');

  useEffect(() => {
    async function updateStatus() {
      const status = await getServerStatus();
      setServerStatus(status);
    }
    updateStatus();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode) return;

    setIsSearching(true);
    setError(null);
    setGeneratedPdfUrl(null);
    setSelectedPapers(new Set());
    setSearchResults([]);

    try {
      let results: QuestionPaper[] = [];
      if (searchType === 'pyq') {
        results = await findPapersBySubject(subjectCode);
        if (results.length === 0) {
          setError(`No question papers found for subject code "${subjectCode}". Check the code and try again.`);
        }
      } else {
        results = await findResearchPapers(subjectCode);
        if (results.length === 0) {
          setError(`No research papers found for query "${subjectCode}". Try a different search term.`);
        }
      }
      setSearchResults(results);
    } catch (err) {
      setError("Failed to fetch papers. The source might be down or your query is incorrect.");
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

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedPdfUrl(null);
    setProgress({ current: 0, total: selectedPapers.size });

    try {
      const papersToMerge = searchResults.filter(p => selectedPapers.has(p.id));
      const paperUrls = papersToMerge.map(p => p.pdfUrl);
      
      const { pdfUrls } = await preparePdfUrls({ pdfUrls: paperUrls });

      const pdfDataUris: string[] = [];
      for (let i = 0; i < pdfUrls.length; i++) {
        if (signal.aborted) {
          throw new DOMException('Aborted by user', 'AbortError');
        }
        setProgress({ current: i + 1, total: pdfUrls.length });
        const dataUri = await fetchPdfAsDataUriClient(pdfUrls[i], signal);
        pdfDataUris.push(dataUri);
      }
      
      const mergedPdfUri = await mergePdfs(pdfDataUris);
      
      const blob = new Blob([dataUriToUint8Array(mergedPdfUri)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);

      if (searchType === 'pyq') {
        addHistoryItem({
            id: Date.now().toString(),
            subjectCode: subjectCode.toUpperCase(),
            timestamp: new Date().toISOString(),
            paperUrls: pdfUrls,
            count: pdfUrls.length,
        });
      }

      toast({
        title: "PDF Generated Successfully!",
        description: "Your merged PDF is ready for download.",
      });

    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast({
          variant: "default",
          title: "Cancelled",
          description: "PDF generation was cancelled.",
        });
      } else {
        setError("Failed to generate PDF. Please try again.");
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error Generating PDF",
          description: "An unexpected error occurred while creating your PDF.",
        });
      }
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = `${subjectCode.toUpperCase()}_papers_merged.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const allSelected = searchResults.length > 0 && selectedPapers.size === searchResults.length;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start bg-background font-body text-foreground overflow-hidden">
      
      <MultiStepLoader loadingStates={loadingStates} loading={isGenerating} duration={1500} />
      
      {isGenerating && (
        <button
          className="fixed top-4 right-4 text-foreground z-[120]"
          onClick={handleCancel}
        >
          <IconSquareRoundedX className="h-10 w-10" />
        </button>
      )}

      <div className="container mx-auto max-w-3xl flex-grow p-4 md:p-8 z-10">
        <header className="flex flex-col items-center justify-center text-center py-8 md:py-12">
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tight text-white">KTUHUB</h1>
          <p className="mt-2 text-md md:text-lg text-muted-foreground font-medium">Your one-stop solution for KTU resources.</p>
          <div className="mt-4">
            <button className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className={cn("absolute inset-[-1000%] animate-[spin_2s_linear_infinite]",
                serverStatus === 'up' ? "bg-[conic-gradient(from_90deg_at_50%_50%,#10B981_0%,#34D399_50%,#10B981_100%)]" :
                serverStatus === 'down' ? "bg-[conic-gradient(from_90deg_at_50%_50%,#EF4444_0%,#F87171_50%,#EF4444_100%)]" :
                "bg-[conic-gradient(from_90deg_at_50%_50%,#FBBF24_0%,#FCD34D_50%,#FBBF24_100%)]"
              )} />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-3xl gap-2">
                <span className="relative flex h-2 w-2">
                    {serverStatus === 'up' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", 
                        serverStatus === 'up' ? 'bg-green-500' :
                        serverStatus === 'down' ? 'bg-red-500' :
                        'bg-yellow-500'
                    )}></span>
                </span>
                {serverStatus === 'up' ? 'Server is Online' : serverStatus === 'down' ? 'Server is Offline' : 'Checking Status...'}
              </span>
            </button>
          </div>
            <Link href="https://whatsapp.com/channel/0029Vb6OCchAzNc1DAIDi02j" target="_blank" className="mt-2 text-sm text-primary hover:underline flex items-center gap-1">
                Join our WhatsApp Channel <ExternalLink className="h-3 w-3" />
            </Link>
        </header>

        <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 rounded-full bg-muted p-1">
                <Button onClick={() => setSearchType('pyq')} variant={searchType === 'pyq' ? 'secondary' : 'ghost'} className="rounded-full">Question Papers</Button>
                <Button onClick={() => setSearchType('research')} variant={searchType === 'research' ? 'secondary' : 'ghost'} className="rounded-full">Research Papers</Button>
            </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <Search className="h-5 w-5 md:h-6 md:w-6" />
              Find {searchType === 'pyq' ? 'Question Papers' : 'Research Papers'}
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {searchType === 'pyq'
                ? 'Enter a subject code to begin (e.g., CS301, MA201).'
                : 'Enter keywords to find research papers.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder={searchType === 'pyq' ? 'Enter Subject Code' : 'Enter Keywords...'}
                value={subjectCode}
                onChange={(e) => setSubjectCode(searchType === 'pyq' ? e.target.value.toUpperCase() : e.target.value)}
                className="text-base md:text-lg h-12"
                aria-label="Search Input"
                disabled={searchType === 'pyq' && serverStatus !== 'up'}
              />
              <Button type="submit" disabled={isSearching || !subjectCode || (searchType === 'pyq' && serverStatus !== 'up')} className="h-12 w-full sm:w-auto text-base md:text-lg font-bold">
                {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {(isSearching || searchResults.length > 0) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                Results
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Select the papers you want to combine and download.</CardDescription>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-2">
                      <Skeleton className="h-6 w-6 rounded-sm bg-muted" />
                      <Skeleton className="h-6 flex-1 bg-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((paper) => (
                    <div key={paper.id} className="flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-accent">
                      <Checkbox
                        id={paper.id}
                        checked={selectedPapers.has(paper.id)}
                        onCheckedChange={(checked) => handleSelectionChange(paper.id, !!checked)}
                        aria-labelledby={`label-${paper.id}`}
                        className="h-5 w-5 rounded"
                      />
                      <Label htmlFor={paper.id} id={`label-${paper.id}`} className="text-sm md:text-base font-normal cursor-pointer flex-grow">
                        {paper.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 bg-muted/50 p-4">
              {!isSearching && searchResults.length > 0 && (
                <Button onClick={handleSelectAll} variant="secondary" className="w-full sm:w-auto">
                  <CheckSquare className="mr-2" />
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              )}
              <div className="w-full sm:w-auto flex flex-col gap-2">
                <Button onClick={handleGeneratePdf} disabled={isGenerating || selectedPapers.size === 0} className="w-full sm:w-auto">
                    <Gift className="mr-2" />
                    {`Generate PDF (${selectedPapers.size})`}
                </Button>
              </div>
              {generatedPdfUrl && (
                <Button onClick={handleDownload} variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2" />
                  Download Merged PDF
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>

      <footer className="w-full py-8 z-10">
        <div className="container mx-auto max-w-3xl flex flex-col items-center gap-4 px-4 text-center">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="upi://pay?pa=sreehari14shr@oksbi&pn=SREEHARI&aid=uGICAgMCOgPK9OA" target="_blank" rel="noopener noreferrer">
                <Button variant="default" className="w-full sm:w-auto">
                  <Heart className="mr-2 h-4 w-4"/>
                  Donate
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Built with ❤️ by Sreehari R
            </p>
        </div>
      </footer>
    </div>
  );
}
    

    




    

    

    

    




    

    

    























    

    

    

    

    
