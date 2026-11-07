import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const PROFILE_IMAGES_BUCKET = 'cinecircle-images';

export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  if (!supabase) {
    throw new Error(
      'Profile image upload is unavailable because VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured.'
    );
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  return supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filePath).data.publicUrl;
}
