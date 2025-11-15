
'use client';

import { useState, useRef } from 'react';
import { useHistory } from '@/hooks/use-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, Trash2, History as HistoryIcon, X, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dataUriToUint8Array, mergePdfs } from '@/lib/pdf-utils';
import { Progress } from '@/components/ui/progress';

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

export default function HistoryPage() {
    const { history, removeHistoryItem } = useHistory();
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const abortControllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();

    const handleRedownload = async (item: ReturnType<typeof useHistory>['history'][0]) => {
        if (generatingId) return;

        setGeneratingId(item.id);
        setProgress({ current: 0, total: item.paperUrls.length });
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const pdfDataUris: string[] = [];
            for (let i = 0; i < item.paperUrls.length; i++) {
                if (signal.aborted) {
                    throw new DOMException('Aborted by user', 'AbortError');
                }
                setProgress({ current: i + 1, total: item.paperUrls.length });
                const dataUri = await fetchPdfAsDataUriClient(item.paperUrls[i], signal);
                pdfDataUris.push(dataUri);
            }

            const mergedPdfUri = await mergePdfs(pdfDataUris);
            const blob = new Blob([dataUriToUint8Array(mergedPdfUri)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.subjectCode}_PYQs_merged_${new Date(item.timestamp).toLocaleDateString()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
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
                console.error("Redownload failed", e);
                toast({
                    variant: "destructive",
                    title: "Error Generating PDF",
                    description: "An unexpected error occurred while creating your PDF.",
                });
            }
        } finally {
            setGeneratingId(null);
            setProgress({ current: 0, total: 0 });
        }
    };
    
    const handleCancel = () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
    };

    return (
        <div className="container mx-auto max-w-3xl flex-grow p-4 md:p-8">
            <header className="flex flex-col items-center justify-center text-center py-8 md:py-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">Download History</h1>
                <p className="mt-4 text-lg text-muted-foreground">Quickly access your previously generated question paper bundles.</p>
            </header>

            {history.length === 0 ? (
                <Card className="w-full text-center">
                    <CardHeader>
                         <CardTitle className="flex justify-center items-center gap-2">
                            <HistoryIcon className="h-8 w-8" />
                            <span>No History Yet!</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You haven't generated any PDFs yet. Go to the homepage to get started.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {history.map(item => (
                        <Card key={item.id} className="w-full transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span className="text-xl font-bold">{item.subjectCode}</span>
                                    <Button onClick={() => removeHistoryItem(item.id)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Generated on {new Date(item.timestamp).toLocaleString()} with {item.count} paper(s).
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="bg-muted/50 p-4">
                                {generatingId === item.id ? (
                                     <div className="w-full flex flex-col gap-2">
                                        <Button disabled className="w-full">
                                            <Loader2 className="animate-spin mr-2" />
                                            Generating ({progress.current}/{progress.total})
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Progress value={(progress.current / progress.total) * 100} className="w-full h-2 rounded-full bg-green-200" />
                                            <Button onClick={handleCancel} variant="destructive" size="sm">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button onClick={() => handleRedownload(item)} className="w-full">
                                        <Download className="mr-2" />
                                        Re-download
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            <footer className="w-full py-8 mt-12 z-10">
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

    
