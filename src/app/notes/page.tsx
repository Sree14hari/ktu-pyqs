
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, NotebookText, Eye, Download, Heart } from 'lucide-react';

async function getNotes() {
  const notesDirectory = path.join(process.cwd(), 'public', 'notes');
  let filenames: string[] = [];

  try {
    filenames = fs.readdirSync(notesDirectory);
  } catch (error) {
    console.error("Could not read notes directory:", error);
    return [];
  }
  
  const notes = filenames
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => {
      const filePath = path.join(notesDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      const preview = content.split(' ').slice(0, 30).join(' ') + '...';

      return {
        slug: filename.replace('.md', ''),
        title: data.title || filename.replace('.md', ''),
        preview: data.description || preview,
      };
    });

  return notes;
}

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="container mx-auto max-w-3xl flex-grow p-4 md:p-8">
      <header className="flex flex-col items-center justify-center text-center py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-white">Special Notes</h1>
        <p className="mt-4 text-lg text-muted-foreground">A collection of handcrafted notes and guides.</p>
      </header>

      <Card className="mb-8 w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            <NotebookText className="h-5 w-5 md:h-6 md:w-6" />
            DM Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm md:text-base text-muted-foreground">Get the complete notes for Disaster Management for free. The notes cover all important topics from all modules with answers.</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
            <a href="https://drive.google.com/file/d/1kyglvRVOR3j0Cs4EVnD6gMAybyDWI69h/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="w-full">
                 <Button variant="outline" className="w-full">
                    <Eye className="mr-2" />
                    Preview
                </Button>
            </a>
          <a href="https://forms.gle/boCtJ44zST6CD6Nb8" target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full">
              Get it now for free
            </Button>
          </a>
        </CardFooter>
      </Card>

      {notes.length === 0 ? (
         <Card className="w-full text-center">
            <CardHeader>
                <CardTitle>No Notes Yet!</CardTitle>
            </CardHeader>
            <CardContent>
                <p>There are no special notes available right now. Check back later!</p>
            </CardContent>
         </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1">
          {notes.map((note) => (
            <Link href={`/notes/${note.slug}`} key={note.slug} className="block group">
                <Card className="w-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{note.title}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{note.preview}</CardDescription>
                  </CardContent>
                </Card>
            </Link>
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

    