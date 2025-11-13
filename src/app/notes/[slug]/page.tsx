import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

async function getNoteContent(slug: string) {
  const notesDirectory = path.join(process.cwd(), 'public', 'notes');
  const filePath = path.join(notesDirectory, `${slug}.md`);

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    return {
      title: data.title || slug.replace(/-/g, ' '),
      content,
    };
  } catch (error) {
    return null;
  }
}

export default async function NotePage({ params }: { params: { slug: string } }) {
  const note = await getNoteContent(params.slug);

  if (!note) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl flex-grow p-4 md:p-8">
      <article className="prose lg:prose-xl dark:prose-invert mx-auto bg-card text-card-foreground p-8 rounded-xl shadow-lg">
        <h1 className="font-headline">{note.title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
      </article>
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

// Generate static paths for all notes at build time
export async function generateStaticParams() {
  const notesDirectory = path.join(process.cwd(), 'public', 'notes');
  try {
    const filenames = fs.readdirSync(notesDirectory);
    return filenames
      .filter((filename) => filename.endsWith('.md'))
      .map((filename) => ({
        slug: filename.replace('.md', ''),
      }));
  } catch (error) {
    console.error('Could not read notes directory for static generation:', error);
    return [];
  }
}

    