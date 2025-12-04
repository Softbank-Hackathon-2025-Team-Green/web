'use server';

import OpenAI from 'openai';

export interface VulnerabilityCheckParams {
  code: string;
  language?: string;
  filename?: string;
}

export interface VulnerabilityCheckResult {
  success: boolean;
  modifiedCode?: string;
  hasIssues?: boolean;
  error?: string;
}

/**
 * Check code for security vulnerabilities using OpenAI
 */
export async function checkCodeVulnerabilities(
  params: VulnerabilityCheckParams
): Promise<VulnerabilityCheckResult> {
  try {
    const { code, language, filename } = params;

    if (!code) {
      return { success: false, error: 'Code is required' };
    }

    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const systemPrompt = `You are a code security expert. Analyze the provided code for security vulnerabilities and potential issues. 

Your task:
1. Identify security vulnerabilities (SQL injection, XSS, command injection, path traversal, etc.)
2. Detect potential infinite loops or performance issues
3. Check for unsafe file system operations
4. Find hardcoded credentials or sensitive data exposure
5. Identify potential DDoS vectors or resource exhaustion issues

Return the MODIFIED code with fixes applied:
- Add comments ABOVE problematic lines explaining the issue (format: // SECURITY: [explanation])
- If code should be removed, comment it out with // REMOVED: prefix and explanation
- Add secure replacement code where appropriate
- If no issues found, return the original code unchanged

Example format:
\`\`\`
// SECURITY: SQL injection vulnerability - user input not sanitized
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

// REMOVED: Infinite Loop - this will cause the program to hang indeifnitely
// while(true){
//   console.log("This is an infinite loop");
// }
\`\`\`

Be concise in your comments. Focus on critical and high-severity issues.`;

    const userPrompt = `Analyze this ${language || 'code'} file (${filename || 'unnamed'}) for security vulnerabilities:

\`\`\`${language || ''}
${code}
\`\`\`

Return ONLY the code with security comment annotations. No additional explanation needed.`;

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt,
            },
          ],
        },
      ],
      temperature: 0.3,
      max_output_tokens: 4000,
    });

    const outputText = response.output_text;
    const modifiedCode = Array.isArray(outputText)
      ? outputText.join('\n')
      : outputText || '';

    // Extract code from markdown code blocks if present
    let extractedCode = modifiedCode;
    const codeBlockMatch = modifiedCode.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      extractedCode = codeBlockMatch[1].trim();
    }

    return {
      success: true,
      modifiedCode: extractedCode,
      hasIssues: extractedCode.includes('// SECURITY:') || extractedCode.includes('// REMOVED:'),
    };
  } catch (error) {
    console.error('AI vulnerability check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
