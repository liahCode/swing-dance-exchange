import fs from 'fs';
import path from 'path';
import MarkdownContent from '@/components/MarkdownContent';
import { getLocale } from 'next-intl/server';

export default async function ImpressumPage() {
  const locale = await getLocale();
  const filePath = path.join(process.cwd(), `content/${locale}/impressum.md`);
  const markdownContent = fs.readFileSync(filePath, 'utf8');

  return (
    <div className="page-container">
      <MarkdownContent content={markdownContent} />
    </div>
  );
}
