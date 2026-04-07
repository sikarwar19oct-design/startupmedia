import fs from 'fs';
import path from 'path';
import { sql } from '@vercel/postgres';

export interface Article {
  slug: string;
  image: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  date: string;
  trending?: boolean;
  author?: string;
}

/**
 * Fetches all articles from either Postgres (Production) or local JSON (Development).
 */
export async function getArticles(): Promise<Article[]> {
  // Check if we have a Database connected (Vercel automatic env var)
  if (process.env.POSTGRES_URL) {
    try {
      // First, ensure table exists (simple one-time check)
      await sql`
        CREATE TABLE IF NOT EXISTS articles (
          slug TEXT PRIMARY KEY,
          title TEXT,
          image TEXT,
          category TEXT,
          excerpt TEXT,
          content TEXT,
          read_time TEXT,
          date TEXT,
          trending BOOLEAN,
          author TEXT
        )
      `;

      const { rows } = await sql`SELECT * FROM articles ORDER BY date DESC`;
      
      // Map SQL rows back to our Article camelCase interface
      const dbArticles: Article[] = rows.map(row => ({
        slug: row.slug,
        title: row.title,
        image: row.image,
        category: row.category,
        excerpt: row.excerpt,
        content: row.content,
        readTime: row.read_time,
        date: row.date,
        trending: row.trending,
        author: row.author
      }));

      // Combined with local articles for fallback/seed
      const jsonArticles = getLocalArticles();
      return [...dbArticles, ...jsonArticles.filter(la => !dbArticles.some(da => da.slug === la.slug))];
    } catch (error) {
      console.error("Database connection failed, falling back to JSON:", error);
    }
  }

  return getLocalArticles();
}

/**
 * Helper to get a single article
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find(article => article.slug === slug);
}

/**
 * Private helper to read the local storage
 */
export function getLocalArticles(): Article[] {
  const filePath = path.join(process.cwd(), 'src/data/articles.json');
  try {
    if (!fs.existsSync(filePath)) return [];
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Failed to read articles database:", error);
    return [];
  }
}
