import Markdown from 'markdown-to-jsx';
import styles from './MarkdownContent.module.css';

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className={styles.markdownContent}>
      <Markdown
        options={{
          overrides: {
            h1: {
              props: {
                className: styles.h1,
              },
            },
            h2: {
              props: {
                className: styles.h2,
              },
            },
            h3: {
              props: {
                className: styles.h3,
              },
            },
            p: {
              props: {
                className: styles.paragraph,
              },
            },
            a: {
              props: {
                className: styles.link,
              },
            },
            ul: {
              props: {
                className: styles.list,
              },
            },
            ol: {
              props: {
                className: styles.list,
              },
            },
            strong: {
              props: {
                className: styles.strong,
              },
            },
            hr: {
              props: {
                className: styles.divider,
              },
            },
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
