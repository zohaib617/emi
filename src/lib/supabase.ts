// page.tsx (Top of the file, after imports)

// --- START Supabase Configuration ---
import { createClient } from '@supabase/supabase-js'

// Next.js خود بخود NEXT_PUBLIC_ سے شروع ہونے والے env variables کو لوڈ کرتا ہے۔
// ! یہ یقینی بناتا ہے کہ TypeScript کو معلوم ہے کہ یہ variables run time پر موجود ہوں گے۔
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// یہاں ہم Supabase client کو initialize کر رہے ہیں۔
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// --- END Supabase Configuration ---

// The rest of your existing TypeScript interfaces and component code follows...
// ...