import Link from "next/link";
import styles from "./dashboard.module.css";
import { getArticles } from "@/data/getArticles";
import ScrollReveal from "@/components/ScrollReveal";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const articles = await getArticles();

  return (
    <div className={`container ${styles.dashboard}`}>
      <ScrollReveal className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Welcome back. Here is how your stories are performing.</p>
        </div>
        <Link href="/admin/editor" className="btn-primary animate-in" style={{ animationDelay: '100ms' }}>
          + Write New Story
        </Link>
      </ScrollReveal>

      <div className={styles.statsGrid}>
        <ScrollReveal className={styles.statCard} delay={100}>
          <div className={styles.statValue}>{articles.length}</div>
          <div className={styles.statLabel}>Total Stories</div>
        </ScrollReveal>
        <ScrollReveal className={styles.statCard} delay={200}>
          <div className={styles.statValue}>
            {articles.reduce((acc, a) => acc + (a.views || 0), 0)}
          </div>
          <div className={styles.statLabel}>Total Reads</div>
        </ScrollReveal>
        <ScrollReveal className={styles.statCard} delay={300}>
          <div className={styles.statValue}>
            {Math.floor(articles.length * 1.5) + 3}
          </div>
          <div className={styles.statLabel}>Subscribers</div>
        </ScrollReveal>
      </div>

      <ScrollReveal className={styles.sectionHeader} delay={400}>
        <h2 className="section-title">Your Stories</h2>
      </ScrollReveal>

      <div className={styles.articleList}>
        {articles.map((article, index) => (
          <ScrollReveal 
            key={`admin-${article.slug || index}`} 
            className={styles.articleRow} 
            delay={500 + index * 50}
          >
            <div>
              <div className={styles.articleTitle}>{article.title}</div>
              <div className={styles.articleCategory}>{article.category}</div>
            </div>
            <div className="hide-on-mobile">
              <span className={`${styles.status} ${article.trending ? styles.published : styles.draft}`}>
                {article.trending ? "trending" : "published"}
              </span>
            </div>
            <div className={`${styles.date} hide-on-mobile`}>{article.date}</div>
            <div className={styles.actions}>
              <Link href={`/admin/editor?slug=${article.slug}`} className={styles.actionBtn}>Edit</Link>
              <button className={styles.actionBtn}>Delete</button>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
