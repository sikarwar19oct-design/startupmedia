"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@vercel/postgres";

export async function saveArticle(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const category = formData.get("category") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const imageFile = formData.get("coverImage");
    const author = formData.get("author") as string || "monarchraushan";

    if (!title || !slug) {
        return { success: false, error: "Title and Slug are required." };
    }

    let imageUrl = "";

    // Safely check if imageFile is a File and has data
    if (imageFile instanceof Blob && imageFile.size > 0 && typeof (imageFile as any).arrayBuffer === 'function') {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fs = require("fs");
        const path = require("path");
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `${Date.now()}-${(imageFile as any).name?.replaceAll(" ", "_") || 'upload'}`;
        const filepath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filepath, buffer);
        imageUrl = `/uploads/${filename}`;
      } catch (e) {
        console.warn("Image upload failed (likely production read-only filesystem), falling back to placeholder.");
        imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80";
      }
    } else {
       imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80";
    }

    const newArticle = {
      slug,
      image: imageUrl,
      category: category || "Uncategorized",
      title,
      excerpt: excerpt || "",
      content: content || "",
      readTime: "5 min",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      trending: false,
      author
    };

    // Database Logic: Use Postgres if URL is present (Vercel Production)
    if (process.env.POSTGRES_URL) {
      await sql`
        INSERT INTO articles (slug, title, image, category, excerpt, content, read_time, date, trending, author)
        VALUES (
          ${newArticle.slug}, 
          ${newArticle.title}, 
          ${newArticle.image}, 
          ${newArticle.category}, 
          ${newArticle.excerpt}, 
          ${newArticle.content}, 
          ${newArticle.readTime}, 
          ${newArticle.date}, 
          ${newArticle.trending}, 
          ${newArticle.author}
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          image = EXCLUDED.image,
          category = EXCLUDED.category,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          read_time = EXCLUDED.read_time,
          date = EXCLUDED.date,
          trending = EXCLUDED.trending,
          author = EXCLUDED.author
      `;
    } else {
      // Local Logic: Use articles.json if no database is connected
      const fs = require("fs");
      const path = require("path");
      const dbPath = path.join(process.cwd(), "src/data/articles.json");
      let articles = [];
      
      try {
        if (fs.existsSync(dbPath)) {
          const fileData = fs.readFileSync(dbPath, "utf8");
          articles = JSON.parse(fileData);
        }
      } catch (error) {
        console.error("Local JSON read failed", error);
      }
      
      const existingIndex = articles.findIndex((a: any) => a.slug === slug);
      if (existingIndex > -1) {
        articles[existingIndex] = newArticle;
      } else {
        articles.unshift(newArticle);
      }
      
      fs.writeFileSync(dbPath, JSON.stringify(articles, null, 2));
    }

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/article/${slug}`);

    return { success: true };
  } catch (err) {
    console.error("Critical error in saveArticle:", err);
    return { success: false, error: "Internal Server Error" };
  }
}
