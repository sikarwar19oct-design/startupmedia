import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";
import { getArticles } from "@/data/getArticles";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const itemsPerPage = 6;

  const allArticles = await getArticles();
  
  // Trending can be based on a flag or just the first 3
  const trendingStories = allArticles.filter(a => a.trending).slice(0, 3);
  if (trendingStories.length === 0) {
      trendingStories.push(...allArticles.slice(0, 3));
  }

  const latestArticles = allArticles;
  const totalItems = latestArticles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedStories = latestArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={`container ${styles.heroContent}`}>
          <div className="animate-in">
            <span className="section-label">Featured Story</span>
            <h1 className={`${styles.heroTitle} float-slow`}>
              The Startups That <span>Refused to Quit</span>
            </h1>
            <p className={styles.heroSub}>
              Behind every unicorn is a moment where quitting was the easier
              choice. These are the stories of founders who chose the harder path
              — and won.
            </p>
            <Link href="/article/21-year-old-built-1m-app" className="btn-primary">
              Read The Story →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TRENDING ===== */}
      <section className={`section ${styles.trendingSection}`}>
        <div className="container">
          <ScrollReveal>
            <span className="section-label">🔥 Trending Now</span>
            <h2 className="section-title">Stories Everyone Is Reading</h2>
          </ScrollReveal>
          
          <div className={styles.trendingGrid}>
            {trendingStories.map((story, i) => (
              <ScrollReveal key={`trending-${story.slug}`} delay={i * 100}>
                <StoryCard {...story} trending />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST STORIES ===== */}
      <section id="stories" className={`section ${styles.storiesSection}`}>
        <div className="container">
          <ScrollReveal>
            <span className="section-label">Latest</span>
            <h2 className="section-title">Fresh Off the Press</h2>
            <p className="section-subtitle">
              Real stories from real founders. No fluff. No filler.
            </p>
          </ScrollReveal>

          <div className={styles.storiesGrid}>
            {paginatedStories.map((story, i) => (
              <ScrollReveal key={`latest-${story.slug}`} delay={i * 50}>
                <StoryCard {...story} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className={styles.pagination}>
            <Link 
              href={`/?page=${currentPage - 1}#stories`} 
              className={`${styles.pageBtn} ${currentPage <= 1 ? styles.disabled : ""}`}
              tabIndex={currentPage <= 1 ? -1 : 0}
            >
              ← Previous
            </Link>
            
            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <Link 
                      key={pNum}
                      href={`/?page=${pNum}#stories`} 
                      className={`${styles.pageBtn} ${currentPage === pNum ? styles.activePage : ""}`}
                    >
                      {pNum}
                    </Link>
                  );
              })}
            </div>
            
            <Link 
              href={`/?page=${currentPage + 1}#stories`} 
              className={`${styles.pageBtn} ${currentPage >= totalPages ? styles.disabled : ""}`}
              tabIndex={currentPage >= totalPages ? -1 : 0}
            >
              Next →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section id="categories" className={`section ${styles.categoriesSection}`}>
        <div className="container">
          <ScrollReveal>
            <span className="section-label">Explore</span>
            <h2 className="section-title">Pick Your Path</h2>
          </ScrollReveal>

          <div className={styles.categoriesGrid}>
            <ScrollReveal className={styles.catCard} delay={0}>
              <a href="/#stories" style={{ display: 'contents' }}>
                <span className={styles.catIcon}>🖥️</span>
                <h3>Tech Startups</h3>
                <p>
                  AI, SaaS, fintech — the founders building the future, one line of
                  code at a time.
                </p>
                <span className={styles.catArrow}>Explore →</span>
              </a>
            </ScrollReveal>
            <ScrollReveal className={styles.catCard} delay={100}>
              <a href="/#stories" style={{ display: 'contents' }}>
                <span className={styles.catIcon}>🎓</span>
                <h3>Student Hustles</h3>
                <p>
                  Dorm-room ideas that became real companies. Young founders proving
                  age is just a number.
                </p>
                <span className={styles.catArrow}>Explore →</span>
              </a>
            </ScrollReveal>
            <ScrollReveal className={styles.catCard} delay={200}>
              <a href="/#stories" style={{ display: 'contents' }}>
                <span className={styles.catIcon}>🏪</span>
                <h3>Small Business Wins</h3>
                <p>
                  Local businesses going global. The everyday entrepreneurs
                  rewriting the rules.
                </p>
                <span className={styles.catArrow}>Explore →</span>
              </a>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className={`section ${styles.newsletterSection}`}>
        <div className="container">
          <ScrollReveal className={styles.newsletterCard}>
            <span className="section-label">Stay Inspired</span>
            <h2 className={styles.newsletterTitle}>
              Get the best founder stories — delivered weekly.
            </h2>
            <p className={styles.newsletterSub}>
              No spam. Just raw, real stories from the startup trenches.
            </p>
            <form className={styles.nlForm} action="#">
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" className="btn-primary">
                Subscribe →
              </button>
            </form>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
