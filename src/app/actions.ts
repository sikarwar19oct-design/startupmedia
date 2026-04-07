"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

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
        console.warn("Image upload failed, falling back to placeholder.");
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
      read_time: "5 min",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      trending: false,
      author
    };

    // Database Logic: Use Supabase if configured
    if (supabase) {
      const { error } = await supabase
        .from('articles')
        .upsert(newArticle, { onConflict: 'slug' });
        
      if (error) {
          console.error("Supabase Save Error:", error.message);
          return { success: false, error: "Database error" };
      }
    } else {
      // Local Logic: Fallback to JSON if no database
      const fs = require("fs");
      const path = require("path");
      const dbPath = path.join(process.cwd(), "src/data/articles.json");
      let articles = [];
      
      try {
        if (fs.existsSync(dbPath)) {
          const fileData = fs.readFileSync(dbPath, "utf8");
          articles = JSON.parse(fileData);
        }
      } catch (e) {}
      
      const existingIndex = articles.findIndex((a: any) => a.slug === slug);
      if (existingIndex > -1) {
        articles[existingIndex] = { ...newArticle, readTime: "5 min" };
      } else {
        articles.unshift({ ...newArticle, readTime: "5 min" });
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

export async function incrementView(slug: string) {
  try {
    if (supabase) {
      // Use RPC if we have it, or just a simple update
      // Supabase supports column increments via SQL but not directly in SDK 
      // without fetch. The most reliable way for now is a simple upsert/update
      const { data, error } = await supabase
        .from('articles')
        .select('views')
        .eq('slug', slug)
        .single();
        
      if (!error && data) {
        await supabase
          .from('articles')
          .update({ views: (data.views || 0) + 1 })
          .eq('slug', slug);
      }
    }
  } catch (err) {
    console.error("View tracking failed:", err);
  }
}
