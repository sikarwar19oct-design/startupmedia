"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

function writeToLog(message: string) {
  const logPath = path.join(process.cwd(), "server_debug.log");
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
}

// FORCE LOG ON STARTUP
writeToLog("--- ACTIONS MODULE LOADED ---");

export async function saveArticle(formData: FormData) {
  try {
    writeToLog("--- START saveArticle ---");
    
    // 0. Environment check
    const url = process.env.SUPABASE_URL || supabaseUrl;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || supabaseServiceKey;

    if (!url || !key || key === "YOUR_SUPABASE_ANON_KEY") {
      writeToLog("MISSING SUPABASE CONFIG");
      return { success: false, error: `Supabase not configured. URL exists: ${!!url}, Key exists: ${!!key}` };
    }
    
    const liveSupabase = createClient(url, key);

    if (!liveSupabase) {
      writeToLog("FAILED CLIENT INITIALIZATION");
      return { success: false, error: "Failed to initialize Supabase client." };
    }

    // 1. Get Fields
    const title = formData.get("title") as string;
    let slug = formData.get("slug") as string;
    
    if (slug) {
      slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const category = formData.get("category") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const imageFile = formData.get("coverImage");
    const existingImageUrl = formData.get("existingImageUrl") as string | null;
    writeToLog(`FIELDS: title=${title}, slug=${slug}, hasNewImage=${imageFile instanceof Blob && imageFile.size > 0}, hasExistingUrl=${!!existingImageUrl}`);

    if (!title || !slug) {
        return { success: false, error: "Title and Slug are required." };
    }

    // Use existing image URL as default (preserves image when editing without re-uploading)
    let imageUrl = existingImageUrl || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80";

    // 2. Image Upload — saves to public/uploads/ (local/self-hosted)
    // File extends Blob, so instanceof Blob covers both File and Blob types
    writeToLog(`IMAGE_FILE: type=${typeof imageFile}, constructor=${imageFile?.constructor?.name}, isBlob=${imageFile instanceof Blob}, size=${(imageFile as any)?.size}`);
    const isValidFile = imageFile instanceof Blob && imageFile.size > 0;
    if (isValidFile) {
      try {
        const blob = imageFile as Blob;
        writeToLog(`IMAGE ATTEMPT: size=${blob.size}, type=${blob.type}`);
        const bytes = await blob.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        fs.mkdirSync(uploadDir, { recursive: true });

        // Sanitize original filename
        const originalName = ((imageFile as any).name as string | undefined) || 'upload.jpg';
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        imageUrl = `/uploads/${filename}`;
        writeToLog(`IMAGE SAVED LOCALLY: ${imageUrl}`);
      } catch (e: any) {
        writeToLog(`IMAGE ERROR: ${e.message}`);
        // Keep default imageUrl (Unsplash placeholder)
      }
    } else {
      writeToLog("NO IMAGE PROVIDED — using placeholder");
    }

    // 3. Prepare Object
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
      author: "monarchraushan"
    };

    // 4. Save to DB
    if (liveSupabase) {
      writeToLog("DB ATTEMPT: Upserting...");
      const { error } = await liveSupabase
        .from('articles')
        .upsert(newArticle, { onConflict: 'slug' });
        
      if (error) {
          writeToLog(`DB ERROR: ${error.message}`);
          return { success: false, error: `Database error: ${error.message}` };
      }
      writeToLog("DB SUCCESS");
    }

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/article/${slug}`);

    writeToLog("--- FINISH SUCCESS ---");
    return { success: true };
  } catch (err: any) {
    writeToLog(`TOP-LEVEL CRASH: ${err.message}\n${err.stack}`);
    return { success: false, error: `Critical Server Error: ${err.message}` };
  }
}

export async function incrementView(slug: string) {
  try {
    if (supabase) {
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

export async function deleteArticle(slug: string) {
  try {
    const url = process.env.SUPABASE_URL || supabaseUrl;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || supabaseServiceKey;
    
    if (!url || !key || key === "YOUR_SUPABASE_ANON_KEY") {
      return { success: false, error: `Supabase not configured. URL exists: ${!!url}, Key exists: ${!!key}` };
    }

    const liveSupabase = createClient(url, key);

    const { error } = await liveSupabase
      .from('articles')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error(`DB DELETE ERROR: ${error.message}`);
      return { success: false, error: `Database error: ${error.message}` };
    }
    
    // Also remove from local JSON if it exists as fallback
    const dbPath = path.join(process.cwd(), "src/data/articles.json");
    if (fs.existsSync(dbPath)) {
      try {
        const fileData = fs.readFileSync(dbPath, "utf8");
        let articles = JSON.parse(fileData);
        articles = articles.filter((a: any) => a.slug !== slug);
        fs.writeFileSync(dbPath, JSON.stringify(articles, null, 2));
      } catch (e) {}
    }

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Critical error in deleteArticle:", err);
    return { success: false, error: `Critical Server Error: ${err.message}` };
  }
}
