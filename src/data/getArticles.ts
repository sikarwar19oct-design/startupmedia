import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
  views?: number;
}

// Supabase Configuration
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  return (url && key && key !== "YOUR_SUPABASE_ANON_KEY") ? createClient(url, key) : null;
}

/**
 * Fetches all articles from either Supabase (Production) or local JSON (Development).
 */
export async function getArticles(): Promise<Article[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const fetchPromise = supabase
        .from('articles')
        .select('*')
        .order('date', { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase request timed out")), 15000)
      );

      // @ts-ignore - Supabase returns a PostgrestBuilder which is Thenable
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!error && data) {
        // Map database columns to Article interface
        const dbArticles: Article[] = data.map((row: any) => ({
          slug: row.slug,
          title: row.title,
          image: row.image,
          category: row.category,
          excerpt: row.excerpt,
          content: row.content,
          readTime: row.read_time || "5 min",
          date: row.date,
          trending: row.trending,
          author: row.author
        }));

        // Return pure database articles without merging local JSON cache
        return dbArticles;
      }
      
      if (error) console.warn("Supabase Fetch Error:", error.message);
    } catch (error) {
      console.error("Supabase connection failed, falling back to JSON:", error);
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
