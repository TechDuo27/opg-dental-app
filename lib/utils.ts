// lib/utils.ts
import { supabase } from "./supabaseClient";

// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}


export const uploadToSupabase = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from("opg-uploads") // replace with your Supabase bucket name
    .upload(filePath, file);

  if (error) {
    throw new Error("Failed to upload image");
  }

  const { data } = supabase.storage
    .from("opg-uploads")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
