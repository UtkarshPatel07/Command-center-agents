import OpenAI from 'openai';

export const CTA_LINK = "https://spikesignals.com/";
export const DISCLAIMER = "Market data, alerts, and signals are for informational and educational purposes only and are not financial advice.";

export async function generateDraft(topic: string, language: string = 'English'): Promise<{content: string, hashtags: string[]}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Return dummy data if no key is provided yet
    return {
      content: `This is a generated draft about ${topic}. Please add your OPENAI_API_KEY to the .env file to enable real AI generation.\n\nBe sure to check out our latest alerts!`,
      hashtags: ['#SpikeSignals', '#Trading', '#Alerts']
    };
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `
  You are an expert Content Writer and SEO Specialist for SpikeSignals.
  Write a highly structured, SEO-optimized "Article-style" social media post about the following topic: "${topic}".
  
  CRITICAL RULES FOR SEO ARTICLE FORMATTING:
  1. The entire post and hashtags MUST be written in ${language}.
  2. The content MUST be structured exactly like a high-ranking SEO blog post. It MUST include:
     - A catchy, bold Headline.
     - An engaging Introduction that hooks the reader.
     - Well-structured Body Paragraphs with bold subheadings.
     - Bullet points or numbered lists to break down complex information clearly.
     - A strong Conclusion or Summary.
  3. Use proper Markdown formatting: use bold text (**text**) for emphasis and subheadings, and dashes (-) for bullet points.
  4. DO NOT use any of these restricted financial words/phrases: "guaranteed returns", "get rich", "passive income", "risk-free", "buy now", "sell now".
  5. The tone should be conversational yet highly professional and insightful, exactly like a premium educational SEO blog.
  6. Provide 3-5 relevant SEO hashtags at the very end.
  7. Do NOT include the CTA link or Disclaimer in your generation; they will be appended automatically.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const output = response.choices[0].message.content || '';
    
    // Simple parser to separate hashtags from main content
    const lines = output.split('\n');
    const contentLines: string[] = [];
    const hashtags: string[] = [];

    lines.forEach(line => {
      if (line.trim().startsWith('#')) {
        hashtags.push(...line.trim().split(' ').filter(word => word.startsWith('#')));
      } else {
        contentLines.push(line);
      }
    });

    return {
      content: contentLines.join('\n').trim(),
      hashtags: hashtags.length > 0 ? hashtags : ['#SpikeSignals', '#MarketData']
    };
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new Error("Failed to generate draft.");
  }
}
