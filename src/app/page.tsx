
"use client";

import { useState, useEffect } from 'react';
import { orientQuestionPaperPages } from '@/ai/flows/orient-pages';
import { suggestVideos, SuggestVideosOutput } from '@/ai/flows/suggest-videos';
import { QuestionPaper, findPapersBySubject, checkServerStatus } from '@/lib/mock-data';
import { dataUriToUint8Array } from '@/lib/pdf-utils';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, FileText, Loader2, AlertCircle, CheckSquare, Github, Linkedin, Instagram, Mail, Coffee, Youtube } from 'lucide-react';

const loadingMessages = [
  "Initializing process...",
  "Gathering selected papers...",
  "Establishing secure connection...",
  "Fetching question papers...",
  "This may take a moment...",
  "Compiling documents...",
  "Almost there...",
  "Finalizing your PDF...",
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
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [serverStatus, setServerStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const [videoSuggestions, setVideoSuggestions] = useState<SuggestVideosOutput | null>(null);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingMessage(loadingMessages[0]); // Reset to the first message
      let messageIndex = 1;
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex = (messageIndex + 1);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    const fetchServerStatus = async () => {
        const isUp = await checkServerStatus();
        setServerStatus(isUp ? 'up' : 'down');
    };
    fetchServerStatus();
  }, []);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode) return;
    
    setIsSearching(true);
    setError(null);
    setGeneratedPdfUrl(null);
    setSelectedPapers(new Set());
    setSearchResults([]);
    setVideoSuggestions(null);
    setIsFetchingVideos(false);

    try {
      const results = await findPapersBySubject(subjectCode);
      if (results.length === 0) {
        setError(`No question papers found for subject code "${subjectCode}".`);
      } else {
        setSearchResults(results);
        setIsFetchingVideos(true);
        // Don't wait for video suggestions to show paper results
        suggestVideos({ courseName: `${subjectCode} - ${results[0].name}` })
          .then(setVideoSuggestions)
          .catch(err => {
              console.error("Failed to fetch video suggestions", err);
              // Silently fail or show a small error notice for videos
          })
          .finally(() => setIsFetchingVideos(false));
      }
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
    <div className="dark relative flex flex-col min-h-screen bg-background font-body text-foreground overflow-hidden">
       <div className="animated-bg">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="shape shape4"></div>
      </div>
      <main className="flex-grow container mx-auto max-w-4xl p-4 md:p-8 z-10">
        <header className="flex flex-col items-center justify-center text-center py-6 md:py-8">
          <h1 className="font-logo text-5xl md:text-6xl font-bold text-primary mb-2">KTU PYQ Finder</h1>
          <p className="mt-2 text-md md:text-lg text-muted-foreground font-medium">Your one-stop solution for KTU question papers.</p>
           <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="relative flex h-3 w-3">
                    {serverStatus === 'up' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${serverStatus === 'up' ? 'bg-green-500' : serverStatus === 'down' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                </span>
                <span>
                    {serverStatus === 'up' ? 'Server is Online' : serverStatus === 'down' ? 'Server is Offline' : 'Checking Server Status...'}
                </span>
            </div>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/30 border-red-700/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-300">Error</AlertTitle>
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="w-full shadow-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
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
                className="text-base md:text-lg h-12 rounded-lg shadow-inner focus:ring-2 focus:ring-primary/80 transition-all bg-white/5 border-white/10"
                aria-label="Subject Code"
                disabled={serverStatus !== 'up'}
              />
              <Button type="submit" disabled={isSearching || !subjectCode || serverStatus !== 'up'} className="h-12 w-full sm:w-auto rounded-lg text-base md:text-lg bg-primary/90 hover:bg-primary transition-all">
                {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {(isSearching || searchResults.length > 0) && (
          <Card className="mt-8 shadow-lg rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
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
                      <Skeleton className="h-6 w-6 rounded-sm bg-slate-700/50" />
                      <Skeleton className="h-6 flex-1 bg-slate-700/50" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((paper) => (
                    <div key={paper.id} className="flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-primary/10">
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
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 bg-black/20 p-4 rounded-b-2xl border-t border-white/10">
              {!isSearching && searchResults.length > 0 && (
                <Button onClick={handleSelectAll} variant="secondary" className="w-full sm:w-auto rounded-lg">
                  <CheckSquare className="mr-2" />
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              )}
               <Button onClick={handleGeneratePdf} disabled={isGenerating || selectedPapers.size === 0} className="w-full sm:w-auto rounded-lg">
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />}
                {isGenerating ? loadingMessage : `Generate PDF (${selectedPapers.size})`}
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

        {(isFetchingVideos || videoSuggestions) && (
          <Card className="mt-8 shadow-lg rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <Youtube className="h-6 w-6 text-red-600" />
                Video Suggestions
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Here are some YouTube videos that might help you with this subject.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingVideos ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full bg-slate-700/50" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {videoSuggestions?.videos.map((video, index) => (
                    <a
                      key={index}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 -mx-3 rounded-lg transition-colors hover:bg-primary/10 bg-black/20"
                    >
                      <Youtube className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm md:text-base font-medium text-foreground">{video.title}</h3>
                        <p className="text-xs text-muted-foreground">Search on YouTube: "{video.searchQuery}"</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Floating Action Button for 'Buy me a coffee' - Mobile Only */}
      <a 
        href="upi://pay?pa=sreehari14shr@oksbi&pn=SREEHARI&aid=uGICAgMCOgPK9OA" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="md:hidden fixed bottom-6 right-6 z-20 h-14 w-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-white"
        aria-label="Buy me a coffee"
      >
        <Coffee className="h-6 w-6"/>
      </a>
      
       <footer className="w-full py-6 z-10">
        <div className="container mx-auto max-w-4xl flex flex-col items-center gap-4 px-4 text-center">
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
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="https://wa.me/message/EZFVK5ZJU5GKA1?src=qr" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-lg bg-white/5 backdrop-blur-sm w-full sm:w-auto">
                  <Mail className="mr-2 h-4 w-4"/>
                  Give Feedback
                </Button>
              </a>
              {/* 'Buy me a coffee' button - Desktop Only */}
              <a href="upi://pay?pa=sreehari14shr@oksbi&pn=SREEHARI&aid=uGICAgMCOgPK9OA" target="_blank" rel="noopener noreferrer" className="hidden md:inline-block">
                <Button variant="outline" className="rounded-lg bg-white/5 backdrop-blur-sm w-full sm:w-auto">
                  <Coffee className="mr-2 h-4 w-4"/>
                  Buy me a coffee
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by Sreehari R
            </p>
        </div>
      </footer>
    </div>
  );
}
