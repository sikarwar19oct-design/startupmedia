"use client";

import { saveArticle } from "@/app/actions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./editor.module.css";
import React, { useState, useEffect, Suspense } from "react";
import DeleteButton from "../dashboard/DeleteButton";

function AdminEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("slug"); // set when editing existing article

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Tech");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editSlug);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB

  // ── Load existing article when editing ──────────────────
  useEffect(() => {
    if (!editSlug) return;

    setIsLoading(true);
    fetch(`/api/articles/${editSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Article not found (${res.status})`);
        return res.json();
      })
      .then((article) => {
        setTitle(article.title || "");
        setSlug(article.slug || "");
        setCategory(article.category || "Tech");
        setExcerpt(article.excerpt || "");
        setContent(article.content || "");
        setExistingImageUrl(article.image || null);
        setCoverImage(article.image || null);
      })
      .catch((err) => {
        console.error("Failed to load article for editing:", err);
        setLoadError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [editSlug]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setImageError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 40 MB.`);
        e.target.value = "";
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
      setCoverImageName(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      setExistingImageUrl(null); // replaced by new upload
    }
  };

  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPublishing(true);

    try {
      const cleanFormData = new FormData();
      cleanFormData.append("title", title);
      cleanFormData.append("slug", slug);
      cleanFormData.append("category", category);
      cleanFormData.append("excerpt", excerpt);
      cleanFormData.append("content", content);

      // If user picked a new file, send it; otherwise send existing URL as string
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        cleanFormData.append("coverImage", fileInput.files[0]);
      } else if (existingImageUrl) {
        cleanFormData.append("existingImageUrl", existingImageUrl);
      }

      const res = await saveArticle(cleanFormData);

      if (res.success) {
        alert(editSlug ? "Article Updated Successfully!" : "Article Published Successfully!");
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        alert("Error: " + (res.error || "Could not save article."));
      }
    } catch (error: any) {
      console.error("Failed to publish article", error);
      alert(`Crash: ${error?.message || String(error)}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.editorContainer} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "var(--color-text-mutted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
          <p>Loading article data...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.editorContainer} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>❌</div>
          <p style={{ color: "#ff4d4f", marginBottom: "1rem" }}>{loadError}</p>
          <Link href="/admin/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      <form onSubmit={handlePublish} className={styles.form}>

        <div className={styles.header}>
          <Link href="/admin/dashboard" className={styles.backBtn}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {editSlug && <DeleteButton slug={editSlug} />}
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "0.75rem 1.5rem" }}
              disabled={isPublishing}
            >
              {isPublishing ? "Saving..." : editSlug ? "Update Article" : "Publish Now"}
            </button>
          </div>
        </div>

        <input
          type="text"
          name="title"
          className={styles.titleInput}
          placeholder="Story Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className={styles.imageUploadContainer}>
          <input
            ref={fileInputRef}
            type="file"
            name="coverImage"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={handleImageUpload}
          />
          {coverImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover Preview" className={styles.imagePreview} />
              <div className={styles.changeImageBtn}>
                🔄 Change Image{coverImageName ? ` — ${coverImageName}` : ""}
              </div>
            </>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <span className={styles.uploadIcon}>📸</span>
              <span>Click to upload a cover image (max 40 MB)</span>
            </div>
          )}
          {imageError && (
            <div style={{ color: "#ff4d4f", fontSize: "0.85rem", marginTop: "0.5rem", padding: "0.5rem", background: "rgba(255,77,79,0.1)", borderRadius: "6px" }}>
              ⚠️ {imageError}
            </div>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="slug">URL Slug</label>
            <input
              type="text"
              id="slug"
              name="slug"
              className={styles.input}
              placeholder="e.g. 21-year-old-built-1m-app"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              readOnly={!!editSlug} // Don't allow changing slug when editing
              style={editSlug ? { opacity: 0.6, cursor: "not-allowed" } : {}}
              title={editSlug ? "Slug cannot be changed when editing an article" : ""}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="Tech">Tech</option>
              <option value="Startup">Startup</option>
              <option value="Small Business">Small Business</option>
              <option value="Student">Student</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="excerpt">Excerpt (Short Summary)</label>
          <textarea
            id="excerpt"
            name="excerpt"
            className={styles.input}
            placeholder="A gripping one-liner to reel them in..."
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content">Story Content (Markdown)</label>
          <textarea
            id="content"
            name="content"
            className={styles.textarea}
            placeholder="Write your story here... Use ## for headings, QUOTE: for pull quotes, * for bullets"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      </form>
    </div>
  );
}

export default function AdminEditor() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--color-text-mutted)" }}>
        Loading editor...
      </div>
    }>
      <AdminEditorInner />
    </Suspense>
  );
}
