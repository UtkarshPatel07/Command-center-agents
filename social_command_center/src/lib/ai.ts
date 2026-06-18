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
     - A catchy Headline.
     - An engaging Introduction that hooks the reader.
     - Well-structured Body Paragraphs with subheadings.
     - Bullet points or numbered lists to break down complex information clearly.
     - A strong Conclusion or Summary.
  3. DO NOT USE ANY MARKDOWN. Do NOT use asterisks (*) for bolding or italics. The text must be plain text. Use spacing and capital letters to create structure if needed.
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

export async function generateInstagramCaption(
    content: string,
    hashtags: string[],
    ctaLink?: string,
    disclaimer?: string
): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        // Return shortened version if no API key
        return generateFallbackCaption(content, hashtags, ctaLink, disclaimer);
    }

    const openai = new OpenAI({ apiKey });

    const hashtagStr = hashtags.join(' ');

    const prompt = `
You are an Instagram caption expert. Format the following content as a professional Instagram caption that follows Instagram best practices.

CRITICAL REQUIREMENTS:
1. Maximum length: 2,200 characters (Instagram's limit)
2. Make it engaging and concise - Instagram users prefer shorter captions with line breaks
3. Use line breaks strategically (use \\n\\n for paragraph breaks, \\n for single line breaks)
4. Keep the core message clear and impactful
5. Do NOT use markdown formatting
6. Include a compelling hook or question at the beginning
7. If there's a CTA link, place it naturally at the end with context
8. Place hashtags either in the caption or as the first comment (mention if should be first comment)

Content to format:
"${content}"

Hashtags to include:
"${hashtagStr}"

CTA Link (if provided): ${ctaLink ? `"${ctaLink}"` : 'None'}
Disclaimer (if provided): ${disclaimer ? `"${disclaimer}"` : 'None'}

Generate ONLY the caption, nothing else. Make sure the total length is under 2,200 characters.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
        });

        let caption = response.choices[0].message.content || '';

        // Ensure it doesn't exceed Instagram's limit
        if (caption.length > 2200) {
            caption = caption.substring(0, 2197) + '...';
        }

        return caption.trim();
    } catch (error) {
        console.error("OpenAI Error generating Instagram caption:", error);
        return generateFallbackCaption(content, hashtags, ctaLink, disclaimer);
    }
}

function generateFallbackCaption(
    content: string,
    hashtags: string[],
    ctaLink?: string,
    disclaimer?: string
): string {
    let caption = content;

    // Truncate if too long
    if (caption.length > 1500) {
        caption = caption.substring(0, 1497) + '...';
    }

    caption += '\n\n' + hashtags.join(' ');

    if (ctaLink) {
        caption += `\n\n🔗 ${ctaLink}`;
    }

    if (disclaimer) {
        caption += `\n\n⚠️ ${disclaimer}`;
    }

    // Final check
    if (caption.length > 2200) {
        caption = caption.substring(0, 2197) + '...';
    }

    return caption;
}
