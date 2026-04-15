export const AI_PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "gemini-2.0-flash",
    description: "Fast and reliable default model",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    model: "claude-3-5-sonnet-20240620",
    description: "High quality coding expert",
  },
  {
    id: "openai",
    name: "OpenAI ChatGPT",
    model: "gpt-4o",
    description: "Powerful and versatile generation",
  }
];

export const getDefaultProvider = () => AI_PROVIDERS[0];
