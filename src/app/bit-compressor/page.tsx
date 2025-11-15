
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Loader2, FileDown, AlertCircle, FileCheck2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function BitCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) { // 50 MB limit
        setError('File is too large. Please upload a PDF under 50MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setCompressedUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
        if (droppedFile.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            setFile(null);
            return;
        }
        if (droppedFile.size > 50 * 1024 * 1024) { 
            setError('File is too large. Please upload a PDF under 50MB.');
            setFile(null);
            return;
        }
      setFile(droppedFile);
      setError(null);
      setCompressedUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please select a file to compress.');
      return;
    }

    setIsCompressing(true);
    setError(null);
    setCompressedUrl(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/compress-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to compress PDF.');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setCompressedUrl(url);

      toast({
        title: 'Compression Successful!',
        description: 'Your BIT-style PDF is ready for download.',
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during compression.');
      toast({
        variant: 'destructive',
        title: 'Compression Failed',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsCompressing(false);
      setProgress(100);
    }
  };
  
  const handleDownload = () => {
    if (!compressedUrl || !file) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    a.download = `${file.name.replace('.pdf', '')}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto max-w-3xl flex-grow p-4 md:p-8">
      <header className="flex flex-col items-center justify-center text-center py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">BIT PDF Compressor</h1>
        <p className="mt-4 text-lg text-muted-foreground">Compress your PDFs into an N-up layout for efficient printing and viewing.</p>
      </header>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Upload Your PDF</CardTitle>
          <CardDescription>Drag and drop your file or click to select.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                    <>
                        <FileCheck2 className="w-10 h-10 mb-3 text-primary" />
                        <p className="mb-2 text-sm text-foreground"><span className="font-semibold">{file.name}</span> selected</p>
                        <p className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </>
                ) : (
                    <>
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF only (MAX. 50MB)</p>
                    </>
                )}
            </div>
            <Input id="file-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} ref={fileInputRef}/>
          </Label>

          {isCompressing && (
             <div className="w-full">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-center mt-2 text-muted-foreground">Compressing, please wait...</p>
             </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 bg-muted/50 p-4">
          {compressedUrl ? (
            <Button onClick={handleDownload} className="w-full sm:w-auto">
              <FileDown className="mr-2" />
              Download Compressed PDF
            </Button>
          ) : (
            <Button onClick={handleCompress} disabled={!file || isCompressing} className="w-full sm:w-auto">
              {isCompressing ? <Loader2 className="mr-2 animate-spin" /> : <Upload className="mr-2" />}
              {isCompressing ? 'Compressing...' : 'Compress PDF'}
            </Button>
          )}
        </CardFooter>
      </Card>
      
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
