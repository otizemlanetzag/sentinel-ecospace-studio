import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  // data URL: data:image/<type>;base64,<...>
  imageDataUrl: z
    .string()
    .min(32)
    .max(12_000_000)
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, "Must be an image file"),
});

export type ReceiptVerification = { verified: boolean; reason: string };

const PROMPT =
  "Analyze this image. It should be an official donation receipt from Team Trees or Delphis NGO " +
  "for a value of at least $5 or 20 ILS. Verify that the image looks authentic, contains the " +
  "organization name, and displays a valid donation confirmation. Respond strictly with a JSON " +
  'object: { "verified": true/false, "reason": "short explanation" }.';

function parseResult(text: string): ReceiptVerification {
  // Pull the first JSON object out of the model response.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { verified: false, reason: "Could not read the AI response." };
  try {
    const parsed = JSON.parse(match[0]) as Partial<ReceiptVerification>;
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
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ReceiptVerification> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { verified: false, reason: "AI verification is not configured." };
    }

    const gateway = createLovableAiGatewayProvider(apiKey);

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
      return parseResult(text);
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
  });
