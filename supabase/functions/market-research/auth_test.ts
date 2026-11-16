import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
const functions = ['market-research','competitor-analysis','business-plan','financial-model','marketing-strategy','ai-operations','advisor-chat'];
for (const name of functions) {
  Deno.test(`${name} rejects requests without a caller before reading business data`, async () => {
    const url = Deno.env.get('SUPABASE_URL');
    if (!url) throw new Error('SUPABASE_URL is required for deployed authorization checks');
    const response = await fetch(`${url}/functions/v1/${name}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({business_id:'00000000-0000-0000-0000-000000000001', message:'Authorization verification'}) });
    await response.text();
    assertEquals(response.status,401);
  });
}