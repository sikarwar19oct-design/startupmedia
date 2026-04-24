"use client";

import { saveArticle } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./editor.module.css";
import React, { useState, useEffect } from "react";
import DeleteButton from "../dashboard/DeleteButton";

export default function AdminEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Tech");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setImageError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max allowed: 40 MB.`);
        e.target.value = "";
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
      setCoverImageName(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    }
  };
  
  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPublishing(true);
    
    try {
      // Manually construct FormData to avoid serialization issues
      const cleanFormData = new FormData();
      cleanFormData.append("title", title);
      cleanFormData.append("slug", slug);
      cleanFormData.append("category", category);
      cleanFormData.append("excerpt", excerpt);
      cleanFormData.append("content", content);
      
      const fileInput = (e.currentTarget as HTMLFormElement).elements.namedItem("coverImage") as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        console.log("Adding file to form data:", fileInput.files[0].name);
        cleanFormData.append("coverImage", fileInput.files[0]);
      } else {
        console.log("No file to add.");
      }

      const res = await saveArticle(cleanFormData);
      
      if (res.success) {
        alert("Article Published Successfully!");
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        alert("Server Error: " + (res.error || "Could not publish article."));
      }
    } catch (error: any) {
      console.error("Failed to publish article", error);
      const technicalError = error?.message || String(error);
      alert(`Submission Crash: ${technicalError}\n\nI have added a 'server_debug.log' on your computer root. Please check that file!`);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className={styles.editorContainer}>
      <form onSubmit={handlePublish} className={styles.form}>
        
        <div className={styles.header}>
          <Link href="/admin/dashboard" className={styles.backBtn}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {slug && <DeleteButton slug={slug} />}
            <button type="button" className="btn-secondary" style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer' }}>
              Save Draft
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish Now"}
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

        <div
          className={styles.imageUploadContainer}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            name="coverImage"
            accept="image/*" 
            className={styles.hiddenFileInput} 
            onChange={handleImageUpload}
            style={{ display: 'none' }}
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
            <div style={{ color: '#ff4d4f', fontSize: '0.85rem', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,77,79,0.1)', borderRadius: '6px' }}>
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
            placeholder="Write your story here... Use markdown for formatting (**bold**, # headings, etc.)" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      </form>
    </div>
  );
}
