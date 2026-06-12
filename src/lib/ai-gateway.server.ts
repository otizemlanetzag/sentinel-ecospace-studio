import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Server-only Lovable AI Gateway provider.
 * Reads LOVABLE_API_KEY (never exposed to the browser) and returns a provider
 * compatible with the AI SDK.
 */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
