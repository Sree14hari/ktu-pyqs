
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calculator, PlusCircle, Trash2, AlertCircle, Heart, Download } from 'lucide-react';
import { generateSgpaPdf } from '@/lib/pdf-utils';
import { useToast } from "@/hooks/use-toast";

const gradePoints: { [key: string]: number } = {
  'S': 10,
  'A+': 9,
  'A': 8.5,
  'B+': 8,
  'B': 7,
  'C': 6,
  'P': 5,
  'F': 0,
};

const creditOptions = ['0', '1', '2', '3', '4'];

type Subject = {
  id: number;
  courseName: string;
  credits: string;
  grade: string;
};

export default function SgpaCalculatorPage() {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, courseName: '', credits: '', grade: '' },
  ]);
  const [sgpa, setSgpa] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), courseName: '', credits: '', grade: '' }]);
  };

  const removeSubject = (id: number) => {
    setSubjects(subjects.filter((sub) => sub.id !== id));
  };

  const handleSubjectChange = (id: number, field: keyof Subject, value: string) => {
    setSubjects(
      subjects.map((sub) => (sub.id === id ? { ...sub, [field]: value } : sub))
    );
  };

  const calculateSgpa = () => {
    let totalCredits = 0;
    let weightedScore = 0;
    setError(null);
    setSgpa(null);

    for (const subject of subjects) {
      const credits = parseFloat(subject.credits);
      const grade = subject.grade;

      if (isNaN(credits) || credits < 0 || !grade) {
        setError('Please select valid credits and a grade for each subject.');
        return;
      }

      if (grade in gradePoints) {
        totalCredits += credits;
        weightedScore += credits * gradePoints[grade];
      } else {
        setError(`Invalid grade "${grade}" selected.`);
        return;
      }
    }

    if (totalCredits === 0 && subjects.some(s => s.credits !== '0')) {
      if (subjects.length > 0 && subjects.every(s => !s.credits || !s.grade)) {
         setError('Please add at least one subject with credits and a grade.');
         return;
      }
    }

    if (totalCredits === 0 && subjects.length > 0) {
        setSgpa(0);
        return;
    }


    const calculatedSgpa = weightedScore / totalCredits;
    setSgpa(parseFloat(calculatedSgpa.toFixed(2)));
  };

  const handleDownloadPdf = async () => {
    if (sgpa === null) return;
    
    try {
        const pdfUri = await generateSgpaPdf(subjects, sgpa);

        const a = document.createElement('a');
        a.href = pdfUri;
        a.download = `SGPA_Report_${new Date().toLocaleDateString()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
            title: "PDF Generated",
            description: "Your SGPA report has been downloaded.",
        });

    } catch (err) {
        console.error("Failed to generate PDF", err);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "There was an error creating your PDF report.",
        });
    }
  };


  const clearAll = () => {
    setSubjects([{ id: 1, courseName: '', credits: '', grade: '' }]);
    setSgpa(null);
    setError(null);
  };

  return (
    <div className="container mx-auto max-w-3xl flex-grow p-4 md:p-8">
      <header className="flex flex-col items-center justify-center text-center py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">SGPA Calculator</h1>
        <p className="mt-4 text-lg text-muted-foreground">Calculate your semester grade point average based on KTU rules.</p>
      </header>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            Enter Your Subjects
          </CardTitle>
          <CardDescription>Add your subjects, credits, and the grades you obtained.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {subjects.map((subject, index) => (
            <div key={subject.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center p-3 rounded-lg border">
              <div className="md:col-span-5">
                <Label htmlFor={`courseName-${subject.id}`} className="sr-only">Course Name</Label>
                <Input
                  id={`courseName-${subject.id}`}
                  placeholder={`Subject ${index + 1} Name (Optional)`}
                  value={subject.courseName}
                  onChange={(e) => handleSubjectChange(subject.id, 'courseName', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                 <Label htmlFor={`credits-${subject.id}`} className="sr-only">Credits</Label>
                <Select
                  value={subject.credits}
                  onValueChange={(value) => handleSubjectChange(subject.id, 'credits', value)}
                >
                  <SelectTrigger id={`credits-${subject.id}`}>
                    <SelectValue placeholder="Credits" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditOptions.map((credit) => (
                      <SelectItem key={credit} value={credit}>
                        {credit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                 <Label htmlFor={`grade-${subject.id}`} className="sr-only">Grade</Label>
                <Select
                  value={subject.grade}
                  onValueChange={(value) => handleSubjectChange(subject.id, 'grade', value)}
                >
                  <SelectTrigger id={`grade-${subject.id}`}>
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(gradePoints).map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                {subjects.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSubject(subject.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addSubject}>
            <PlusCircle className="mr-2" />
            Add Another Subject
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 bg-muted/50 p-4">
          <Button variant="secondary" onClick={clearAll}>
            Clear All
          </Button>
          <Button onClick={calculateSgpa}>
            <Calculator className="mr-2" />
            Calculate SGPA
          </Button>
        </CardFooter>
      </Card>
      
      {sgpa !== null && (
        <Card className="mt-8 text-center">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Your SGPA</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-6xl font-headline font-bold text-primary-foreground dark:text-primary">{sgpa.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="justify-center">
                <Button onClick={handleDownloadPdf} variant="outline">
                    <Download className="mr-2" />
                    Download as PDF
                </Button>
            </CardFooter>
        </Card>
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

    
