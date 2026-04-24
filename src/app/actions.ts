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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  // Also write to local file if possible (dev only)
  try {
    const logPath = path.join(process.cwd(), "server_debug.log");
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (_e) { /* ignore in production */ }
}

writeToLog("--- ACTIONS MODULE LOADED ---");

/**
 * Uploads a file to Supabase Storage bucket "article-images".
 * Returns the public URL on success, or null on failure.
 */
async function uploadToSupabaseStorage(
  client: any,
  blob: Blob,
  slug: string
): Promise<string | null> {
  try {
    const bytes = await blob.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = ((blob as any).name as string | undefined) || "cover.jpg";
    const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `covers/${slug}-${Date.now()}.${ext}`;
    const contentType = blob.type || "image/jpeg";

    writeToLog(`STORAGE UPLOAD: bucket=article-images path=${filename} size=${blob.size}`);

    const { error: uploadError } = await client.storage
      .from("article-images")
      .upload(filename, buffer, { contentType, upsert: true });

    if (uploadError) {
      writeToLog(`STORAGE ERROR: ${uploadError.message}`);
      return null;
    }

    const { data: publicData } = client.storage
      .from("article-images")
      .getPublicUrl(filename);

    writeToLog(`STORAGE SUCCESS: ${publicData.publicUrl}`);
    return publicData.publicUrl;
  } catch (e: any) {
    writeToLog(`STORAGE EXCEPTION: ${e.message}`);
    return null;
  }
}

/**
 * Falls back to saving the file on local disk (only works in local dev, not Netlify).
 */
async function uploadToLocalDisk(blob: Blob): Promise<string | null> {
  try {
    const bytes = await blob.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = ((blob as any).name as string | undefined) || "upload.jpg";
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    const url = `/uploads/${filename}`;
    writeToLog(`LOCAL DISK SAVED: ${url}`);
    return url;
  } catch (e: any) {
    writeToLog(`LOCAL DISK ERROR: ${e.message}`);
    return null;
  }
}

export async function saveArticle(formData: FormData) {
  try {
    writeToLog("--- START saveArticle ---");

    // 0. Environment check
    const url = process.env.SUPABASE_URL || supabaseUrl;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || supabaseServiceKey;

    if (!url || !key || key === "YOUR_SUPABASE_ANON_KEY") {
      writeToLog("MISSING SUPABASE CONFIG");
      return { success: false, error: `Supabase not configured. URL: ${!!url}, Key: ${!!key}` };
    }

    const liveSupabase = createClient(url, key);

    // 1. Get Fields
    const title = formData.get("title") as string;
    let slug = formData.get("slug") as string;
    if (slug) {
      slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    const category = formData.get("category") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const imageFile = formData.get("coverImage");
    const existingImageUrl = formData.get("existingImageUrl") as string | null;

    writeToLog(`FIELDS: title=${title}, slug=${slug}, hasFile=${imageFile instanceof Blob && imageFile.size > 0}, existingUrl=${existingImageUrl?.substring(0, 60)}`);

    if (!title || !slug) {
      return { success: false, error: "Title and Slug are required." };
    }

    // 2. Image Upload
    // Priority: new file → Supabase Storage → local disk fallback
    let imageUrl = existingImageUrl || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80";

    const isValidFile = imageFile instanceof Blob && imageFile.size > 0;
    if (isValidFile) {
      writeToLog(`NEW IMAGE: size=${imageFile.size}, type=${imageFile.type}`);

      // Try Supabase Storage first (works in production + local)
      const storageUrl = await uploadToSupabaseStorage(liveSupabase, imageFile, slug);
      if (storageUrl) {
        imageUrl = storageUrl;
      } else {
        // Fallback: local disk (only works in local dev)
        writeToLog("Supabase Storage failed, trying local disk fallback...");
        const localUrl = await uploadToLocalDisk(imageFile);
        if (localUrl) {
          imageUrl = localUrl;
        } else {
          writeToLog("Both upload methods failed — keeping existing/placeholder image");
        }
      }
    } else {
      writeToLog("No new image file provided — keeping existing image URL");
    }

    // 3. Prepare Article Object
    const newArticle = {
      slug,
      image: imageUrl,
      category: category || "Uncategorized",
      title,
      excerpt: excerpt || "",
      content: content || "",
      read_time: "5 min",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      trending: false,
      author: "monarchraushan",
    };

    // 4. Save to Database
    writeToLog("DB ATTEMPT: Upserting...");
    const { error: dbError } = await liveSupabase
      .from("articles")
      .upsert(newArticle, { onConflict: "slug" });

    if (dbError) {
      writeToLog(`DB ERROR: ${dbError.message}`);
      return { success: false, error: `Database error: ${dbError.message}` };
    }
    writeToLog("DB SUCCESS");

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
        .from("articles")
        .select("views")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        await supabase
          .from("articles")
          .update({ views: (data.views || 0) + 1 })
          .eq("slug", slug);
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
      return { success: false, error: `Supabase not configured.` };
    }

    const liveSupabase = createClient(url, key);

    const { error } = await liveSupabase
      .from("articles")
      .delete()
      .eq("slug", slug);

    if (error) {
      console.error(`DB DELETE ERROR: ${error.message}`);
      return { success: false, error: `Database error: ${error.message}` };
    }

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Critical error in deleteArticle:", err);
    return { success: false, error: `Critical Server Error: ${err.message}` };
  }
}
