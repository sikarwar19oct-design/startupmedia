import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            Startup<span>Media</span>
          </Link>
          <p className={styles.tagline}>
            Stories that inspire the next generation of builders.
          </p>
        </div>

        <nav className={styles.links}>
          <div className={styles.col}>
            <h4>Navigate</h4>
            <Link href="/">Home</Link>
            <Link href="/#stories">Stories</Link>
            <Link href="/#categories">Categories</Link>
            <Link href="/admin/dashboard" style={{ marginTop: '0.8rem', opacity: 0.6, fontSize: '0.85rem', display: 'block' }}>Admin Dashboard</Link>
          </div>
          <div className={styles.col}>
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/contact">Get Featured</Link>
          </div>
          <div className={styles.col}>
            <h4>Categories</h4>
            <Link href="/#categories">Tech</Link>
            <Link href="/#categories">Student</Link>
            <Link href="/#categories">Small Business</Link>
          </div>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>&copy; {new Date().getFullYear()} StartupMedia. All rights reserved.</p>
      </div>
    </footer>
  );
}
