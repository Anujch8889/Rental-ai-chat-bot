const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXTRACTION_PROMPT = `You are a data extraction assistant. Analyze the following conversation between a user and a rental property chatbot. Extract any lead information that has been mentioned by the user.

Return ONLY a valid JSON object with these fields. Use null for any field that hasn't been mentioned or is unknown:

{
  "name": "string or null - the user's full name",
  "phone": "string or null - the user's phone number",
  "email": "string or null - the user's email address",
  "property_type": "rent or buy or null - whether user wants to rent or buy",
  "category": "flat or house or shop or office or null - type of property",
  "city": "string or null - the city they want property in",
  "area": "string or null - specific area/locality preference",
  "bedrooms": "string or null - e.g. 1BHK, 2BHK, 3BHK, 4BHK",
  "budget_min": "number or null - minimum budget in rupees",
  "budget_max": "number or null - maximum budget in rupees",
  "priority_notes": "string or null - any special preferences, priorities, or additional notes"
}

RULES:
- Return ONLY the JSON object, no markdown formatting, no backticks, no explanation.
- If the user mentions something like "2BHK" or "2 bhk" normalize it to "2BHK".
- If user says "flat" or "apartment", set category to "flat".
- If user says "independent house", "row house", "villa", "ghar", set category to "house".
- If user mentions budget like "20-30 thousand" for rent, convert to numbers (budget_min: 20000, budget_max: 30000).
- If user mentions budget like "50 lakh" for buying, convert properly (5000000).
- Capture any special notes like "garden facing", "ground floor", "parking needed" in priority_notes.
- For Hinglish text, extract the actual meaning (e.g., "merko ghar chahiye" = they want a house).`;

/**
 * Extract structured lead data from conversation history using Gemini
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<Object>} Extracted lead data
 */
async function extractLeadData(messages) {
  try {
    // Build conversation text
    const conversationText = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Here is the conversation:\n\n${conversationText}`,
      config: {
        systemInstruction: EXTRACTION_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    });

    const text = response.text.trim();

    // Try to parse JSON - handle cases where Gemini wraps in ```json
    let jsonStr = text;
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonStr);
    return data;
  } catch (error) {
    console.error('Lead extraction error:', error.message);
    return {};
  }
}

module.exports = { extractLeadData };
