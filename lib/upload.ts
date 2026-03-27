import * as ImagePicker from "expo-image-picker";

import { getSupabaseClient, supabaseUrl, supabaseAnonKey } from "./supabase/client";

// Pick an image from device library or camera.
// Returns local URI string, or null if cancelled.
export async function pickImage(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect,
    quality: 0.8
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
}

// Upload an image to Supabase storage.
// Works on both native (file:// URIs) and web (blob: URIs) via fetch.
// Returns the public URL of the uploaded file.
export async function uploadImage(params: {
  bucket: "profiles" | "recipes" | "meals" | "recipe-steps";
  path: string;
  uri: string;
  mimeType?: string;
}): Promise<string> {
  const { bucket, path, uri, mimeType = "image/jpeg" } = params;

  const supabase = getSupabaseClient();

  // Ensure the session JWT is loaded. On web, AsyncStorage is async so the
  // Supabase storage SDK may not have the token yet — we attach it manually.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated. Please sign in and try again.");
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Failed to read image file.");
  }
  const blob = await response.blob();

  // Bypass the storage SDK and use a raw fetch so the Bearer token is
  // guaranteed to be included regardless of AsyncStorage init timing.
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": supabaseAnonKey!,
      "Content-Type": mimeType,
      "x-upsert": "true"
    },
    body: blob
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text();
    throw new Error(`Failed to upload image: ${body}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Convenience: pick then upload in one call.
// Returns public URL, or null if user cancelled.
export async function pickAndUploadImage(params: {
  bucket: "profiles" | "recipes" | "meals" | "recipe-steps";
  path: string;
  options?: { allowsEditing?: boolean; aspect?: [number, number] };
}): Promise<string | null> {
  const uri = await pickImage(params.options);
  if (!uri) {
    return null;
  }

  return uploadImage({ bucket: params.bucket, path: params.path, uri });
}
