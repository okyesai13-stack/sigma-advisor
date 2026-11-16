import { createClient } from "npm:@supabase/supabase-js@2";

// Charges the signed-in caller for an AI action. Returns null on success, or an error code.
export async function spendCredits(authHeader: string | null, action: string): Promise<null | "insufficient_credits" | "credit_error"> {
  if (!authHeader) return "credit_error";
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
  if(!url||!key)return 'credit_error';
  const client = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
  });
  const { error } = await client.rpc("spend_credits", { p_action: action });
  if (!error) return null;
  return error.message?.includes("insufficient_credits") ? "insufficient_credits" : "credit_error";
}
