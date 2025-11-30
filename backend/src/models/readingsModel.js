import { supabase } from "../config/supabaseClient.js";

const TABLE = "sensor_readings";

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    temperature: row.temperature === null ? null : Number(row.temperature),
    threshold_value:
      row.threshold_value === null ? null : Number(row.threshold_value),
  };
}

export const ReadingsModel = {
  // MODIFIKASI: Mendukung pagination
  async list(page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Ambil data dengan range tertentu dan total count
    const { data, error, count } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at", { count: "exact" })
      .order("recorded_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data: data.map(normalize),
      total: count, // Total semua data di database
      page,
      limit
    };
  },

  async latest() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return normalize(data);
  },

  async create(payload) {
    const { temperature, threshold_value } = payload;

    if (typeof temperature !== "number") {
      throw new Error("temperature must be a number");
    }

    const newRow = {
      temperature,
      threshold_value: threshold_value ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(newRow)
      .select("id, temperature, threshold_value, recorded_at")
      .single();

    if (error) throw error;
    return normalize(data);
  },

  async clear() {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .gt("recorded_at", "1970-01-01T00:00:00Z");

    if (error) throw error;
    return { message: "All sensor readings cleared." };
  },
};