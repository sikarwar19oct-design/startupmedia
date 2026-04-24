import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";
import { getArticles } from "@/data/getArticles";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import HeroParticles from "@/components/HeroParticles";
import QuoteCard from "@/components/QuoteCard";
import NewsletterForm from "@/components/NewsletterForm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Magnetic from "@/components/Magnetic";
import MouseTilt from "@/components/MouseTilt";
import Parallax from "@/components/Parallax";

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
  
  // Normal Pagination:
  const totalPages = Math.max(1, Math.ceil(latestArticles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStories = latestArticles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <Parallax speed={-0.2} className={styles.heroBgContainer}>
          <div className={styles.heroBg} />
          {/* Animated News Ticker Pattern */}
          <div className={styles.newsTickerBg}>
            <div className={styles.tickerTrack}>
              <span>BREAKING NEWS • EXCLUSIVE STORIES • LATEST STARTUP UPDATES • FUNDING ROUNDS • FOUNDERS • THE UNTOLD STORIES •&nbsp;</span>
              <span>BREAKING NEWS • EXCLUSIVE STORIES • LATEST STARTUP UPDATES • FUNDING ROUNDS • FOUNDERS • THE UNTOLD STORIES •&nbsp;</span>
            </div>
            <div className={`${styles.tickerTrack} ${styles.tickerTrackReverse}`}>
              <span>MARKET TRENDS • UNICORN SPOTLIGHT • TECH INNOVATION • SILICON VALLEY SECRETS • EXPANSION • PIVOT STRATEGIES •&nbsp;</span>
              <span>MARKET TRENDS • UNICORN SPOTLIGHT • TECH INNOVATION • SILICON VALLEY SECRETS • EXPANSION • PIVOT STRATEGIES •&nbsp;</span>
            </div>
            <div className={styles.tickerTrack}>
              <span>VENTURE CAPITAL • ANGEL INVESTORS • IPO WATCH • DISRUPTIVE BUSINESS MODELS • BOOTSTRAPPED • GROWTH HACKING •&nbsp;</span>
              <span>VENTURE CAPITAL • ANGEL INVESTORS • IPO WATCH • DISRUPTIVE BUSINESS MODELS • BOOTSTRAPPED • GROWTH HACKING •&nbsp;</span>
            </div>
          </div>
        </Parallax>
        
        <HeroParticles />

        {/* Floating 3D Decorative Elements */}
        <div className={styles.floatingStuff}>
          <Parallax speed={0.15} className={`${styles.floatItem} ${styles.float1}`}>
            <div className={styles.glassCircle} />
          </Parallax>
          <Parallax speed={0.3} className={`${styles.floatItem} ${styles.float2}`}>
            <div className={styles.glassSquare} />
          </Parallax>
          <Parallax speed={-0.1} className={`${styles.floatItem} ${styles.float3}`}>
            <div className={styles.glassTriangle} />
          </Parallax>
        </div>

        <div className={`container ${styles.heroInner}`}>
          {/* Left: text */}
          <MouseTilt intensity={8} className={`${styles.heroContent} animate-in`}>
            <span className="section-label">Exclusive</span>
            <h1 className={`${styles.heroTitle} float-slow`}>
              The Untold Stories of <span>Resilience</span>
            </h1>
            <p className={styles.heroSub}>
              Behind every billion-dollar unicorn is a moment where quitting was the rational choice. We tell the stories of the outliers who defied the odds.
            </p>
            <Magnetic strength={0.3}>
              <Link href="/#stories" className="btn-primary">
                Read The Stories →
              </Link>
            </Magnetic>
          </MouseTilt>

          {/* Right: animated quotes card */}
          <MouseTilt intensity={12} className={styles.cardTiltWrap}>
            <QuoteCard />
          </MouseTilt>
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
              <ScrollReveal key={`latest-${currentPage}-${i}-${story?.slug}`} delay={i * 50}>
                {story && <StoryCard {...story} />}
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
                  const startPage = Math.max(1, currentPage - 2);
                  const pNum = startPage + i;
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
            <MouseTilt intensity={5} className={styles.catTiltWrapper}>
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
            </MouseTilt>
            <MouseTilt intensity={5} className={styles.catTiltWrapper}>
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
            </MouseTilt>
            <MouseTilt intensity={5} className={styles.catTiltWrapper}>
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
            </MouseTilt>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className={`section ${styles.newsletterSection}`}>
        <div className="container">
            <div className={styles.newsletterCard}>
              <span className="section-label">Stay Inspired</span>
              <h2 className={styles.newsletterTitle}>
                Get the best founder stories — delivered weekly.
              </h2>
              <p className={styles.newsletterSub}>
                No spam. Just raw, real stories from the startup trenches.
              </p>
              
              <NewsletterForm />
            </div>
        </div>
      </section>
    </>
  );
}
