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
    const slug = formData.get("slug") as string;
    const category = formData.get("category") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const imageFile = formData.get("coverImage");
    writeToLog(`FIELDS: title=${title}, slug=${slug}`);

    if (!title || !slug) {
        return { success: false, error: "Title and Slug are required." };
    }

    let imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80";

    // 2. Image Upload (Isolated try-catch)
    if (imageFile instanceof Blob && imageFile.size > 0 && typeof (imageFile as any).arrayBuffer === 'function') {
      try {
        writeToLog(`IMAGE ATTEMPT: size=${imageFile.size}`);
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${(imageFile as any).name?.replaceAll(" ", "_") || 'upload'}`;
        const filepath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filepath, buffer);
        imageUrl = `/uploads/${filename}`;
        writeToLog(`IMAGE SAVED: ${imageUrl}`);
      } catch (e: any) {
        writeToLog(`IMAGE ERROR: ${e.message}`);
        imageUrl = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80";
      }
    } else {
       writeToLog("NO IMAGE OR BLOB INVALID");
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
