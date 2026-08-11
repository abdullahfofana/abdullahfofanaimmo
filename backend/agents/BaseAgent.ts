import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  if (!apiKey) {
    console.warn('[BaseAgent] OPENAI_API_KEY not set — agents will use fallback responses.');
    return null;
  }
  try {
    _openai = new OpenAI({ apiKey });
    return _openai;
  } catch {
    return null;
  }
}

// ─── Tool definition types ────────────────────────────────────────────────────
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

// ─── Agent memory / conversation turn ────────────────────────────────────────
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

// ─── Base Agent class ─────────────────────────────────────────────────────────
export abstract class BaseAgent {
  protected abstract name: string;
  protected abstract systemPrompt: string;
  protected tools: AgentTool[] = [];
  protected maxSteps = 6; // max agentic steps before forcing a final answer
  protected model = 'gpt-3.5-turbo';

  /**
   * Run the agent with an initial user message.
   * Executes tool calls in a loop until the model returns a final answer.
   */
  async run(userMessage: string, context?: Record<string, any>): Promise<string> {
    const openai = getOpenAI();
    if (!openai) {
      return this.fallbackResponse(userMessage, context);
    }

    const systemContent = context
      ? `${this.systemPrompt}\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : this.systemPrompt;

    const messages: AgentMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userMessage },
    ];

    const toolDefs = this.tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: t.parameters,
          required: Object.keys(t.parameters).filter(
            (k) => !t.parameters[k]?.optional
          ),
        },
      },
    }));

    for (let step = 0; step < this.maxSteps; step++) {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: messages as any,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        tool_choice: toolDefs.length > 0 ? 'auto' : undefined,
        max_tokens: 800,
        temperature: 0.3,
      });

      const choice = response.choices[0];

      // Final answer — no more tool calls
      if (choice.finish_reason === 'stop' || !choice.message.tool_calls) {
        return choice.message.content ?? 'No response generated.';
      }

      // Push assistant message with tool_calls
      messages.push({ ...choice.message } as any);

      // Execute all tool calls in this step
      for (const tc of choice.message.tool_calls) {
        const toolCall = tc as any;
        const tool = this.tools.find((t) => t.name === toolCall.function?.name);
        let toolResult: string;

        try {
          const args = JSON.parse(toolCall.function?.arguments || '{}');
          const result = tool ? await tool.execute(args) : { error: 'Tool not found' };
          toolResult = JSON.stringify(result);
        } catch (err: any) {
          toolResult = JSON.stringify({ error: err.message ?? 'Tool execution failed' });
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function?.name,
          content: toolResult,
        } as any);
      }
    }

    // Safety fallback if we hit maxSteps
    return 'I was unable to complete the analysis within the allowed steps. Please try again with a more specific question.';
  }

  /**
   * Fallback when OpenAI is not configured — override per agent for better UX.
   */
  protected fallbackResponse(_userMessage: string, _context?: Record<string, any>): string {
    return `[${this.name}] is running in offline mode. AI features are unavailable without an OpenAI API key.`;
  }
}
