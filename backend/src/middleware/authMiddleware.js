import { supabase } from "../config/supabaseClient.js";

export const requireAuth = async (req, res, next) => {
  // 1. Ambil token dari header "Authorization: Bearer <TOKEN>"
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  // 2. Cek ke Supabase apakah token ini valid
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // 3. Jika valid, simpan info user di request dan lanjut
  req.user = user;
  next();
};