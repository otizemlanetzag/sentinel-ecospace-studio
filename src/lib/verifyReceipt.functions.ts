import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  // data URL: data:image/<type>;base64,<...>
  imageDataUrl: z
    .string()
    .min(32)
    .max(12_000_000)
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, "Must be an image file"),
});

export type ReceiptVerification = {
  verified: boolean;
  reason: string;
  paidUntil?: string | null;
};

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const PROMPT =
  "Analyze this image. It should be an official donation receipt from Team Trees or Delphis NGO " +
  "for a value of at least $5 or 20 ILS. Verify that the image looks authentic, contains the " +
  "organization name, and displays a valid donation confirmation. Respond strictly with a JSON " +
  'object: { "verified": true/false, "reason": "short explanation" }.';

function parseResult(text: string): { verified: boolean; reason: string } {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { verified: false, reason: "Could not read the AI response." };
  try {
    const parsed = JSON.parse(match[0]) as { verified?: boolean; reason?: string };
    return {
      verified: parsed.verified === true,
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim()
          : parsed.verified
            ? "Receipt verified."
            : "Receipt could not be verified.",
    };
  } catch {
    return { verified: false, reason: "Could not parse the AI response." };
  }
}

export const verifyReceiptWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ReceiptVerification> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { verified: false, reason: "AI verification is not configured." };
    }

    const gateway = createLovableAiGatewayProvider(apiKey);

    let result: { verified: boolean; reason: string };
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image", image: data.imageDataUrl },
            ],
          },
        ],
      });
      result = parseResult(text);
    } catch (err) {
      const status =
        err != null && typeof err === "object" && "statusCode" in err
          ? (err as { statusCode?: number }).statusCode
          : undefined;
      if (status === 429)
        return { verified: false, reason: "AI is busy right now — please try again shortly." };
      if (status === 402)
        return { verified: false, reason: "AI verification credits exhausted. Try later." };
      console.error("verifyReceiptWithAI failed", err);
      return { verified: false, reason: "AI verification failed. Please try again." };
    }

    if (!result.verified) return result;

    // Persist entitlement: paid_until = now + 60 days for the signed-in user.
    const paidUntil = new Date(Date.now() + SIXTY_DAYS_MS).toISOString();
    const { error } = await context.supabase
      .from("user_entitlements")
      .upsert(
        { user_id: context.userId, paid_until: paidUntil },
        { onConflict: "user_id" },
      );

    if (error) {
      console.error("Failed to save entitlement", error);
      return { verified: false, reason: "Verified, but saving access failed. Try again." };
    }

    return { verified: true, reason: result.reason, paidUntil };
  });

export const getMyEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ paidUntil: string | null }> => {
    const { data, error } = await context.supabase
      .from("user_entitlements")
      .select("paid_until")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !data?.paid_until) return { paidUntil: null };
    if (new Date(data.paid_until).getTime() <= Date.now()) return { paidUntil: null };
    return { paidUntil: data.paid_until };
  });
