import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import { getSupabaseClient } from "./supabase/client";

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Pick an image from device library or camera
// Returns local URI string, or null if cancelled
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

// Upload an image file to Supabase storage
// Returns the public URL of the uploaded file
// Throws on failure
export async function uploadImage(params: {
  bucket: "profiles" | "recipes" | "meals" | "recipe-steps";
  path: string;
  uri: string;
  mimeType?: string;
}): Promise<string> {
  const { bucket, path, uri, mimeType = "image/jpeg" } = params;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64"
  });

  const bytes = decode(base64);

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: mimeType,
    upsert: true
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Convenience: pick then upload in one call
// Returns public URL, or null if user cancelled
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
