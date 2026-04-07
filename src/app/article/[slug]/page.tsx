import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";
import { getArticleBySlug, getArticles } from "@/data/getArticles";
import { notFound } from "next/navigation";
import ArticleProgress from "./ArticleProgress";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  // Track view (Non-blocking)
  if (article) {
    const { incrementView } = require("@/app/actions");
    incrementView(slug).catch(console.error);
  }

  if (!article) {
    notFound();
  }

  // Related stories - get a few other articles
  const allArticles = await getArticles();
  const relatedStories = allArticles
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  // Content rendering helper
  const renderContent = (content: string | string[]) => {
    if (Array.isArray(content)) {
      return content.map((block, i) => {
        if (block.startsWith("QUOTE:")) {
          return (
            <blockquote key={i} className={styles.pullQuote}>
              <p>{block.replace("QUOTE:", "")}</p>
            </blockquote>
          );
        }
        return <p key={i}>{block}</p>;
      });
    }
    
    // Handle string content with newlines
    return content.split('\n').filter(p => p.trim() !== '').map((block, i) => {
        if (block.startsWith("QUOTE:") || block.startsWith("> ")) {
          return (
            <blockquote key={i} className={styles.pullQuote}>
              <p>{block.replace(/^QUOTE:|^>\s*/, "")}</p>
            </blockquote>
          );
        }
        if (block.startsWith("## ")) {
            return <h2 key={i}>{block.replace("## ", "")}</h2>;
        }
        return <p key={i}>{block}</p>;
    });
  };

  return (
    <>
      <ArticleProgress />

      {/* Hero */}
      <section className={styles.hero}>
        <img src={article.image} alt={article.title} className={styles.heroImage} />
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <span className="category-pill">{article.category}</span>
          <h1 className={styles.heroTitle}>{article.title}</h1>
          <div className={styles.heroMeta}>
            <span>{article.author || "monarchraushan"}</span>
            <span className={styles.dot}>·</span>
            <span>{article.date}</span>
            <span className={styles.dot}>·</span>
            <span>{article.readTime} read</span>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <article className={styles.article}>
        <div className={styles.articleInner}>
          {renderContent(article.content)}
        </div>
      </article>

      {/* Read Next */}
      <section className={`section ${styles.readNextSection}`}>
        <div className="container">
          <span className="section-label">Continue Reading</span>
          <h2 className="section-title">You May Also Like</h2>
          <div className={styles.relatedGrid}>
            {relatedStories.map((story) => (
              <StoryCard key={story.slug} {...story} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
