"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          Startup<span>Media</span>
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/#stories" onClick={() => setMenuOpen(false)}>Stories</Link>
          <Link href="/#categories" onClick={() => setMenuOpen(false)}>Categories</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          <Link href="/admin/dashboard" className={styles.adminLink} onClick={() => setMenuOpen(false)}>Admin</Link>
        </nav>

        <button
          className={`${styles.burger} ${menuOpen ? styles.active : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
