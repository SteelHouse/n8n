import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class GenerateText implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Generate Text",
    name: "generateText",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    description: "Generate text using AI models with automatic asset saving",
    defaults: {
      name: "Generate Text",
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: "creativeSuiteApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Text Model",
        name: "textModel",
        type: "options",
        options: [
          { name: "GPT-4o", value: "gpt-4o" },
          { name: "GPT-4o Mini", value: "gpt-4o-mini" },
          { name: "GPT-4", value: "gpt-4" },
          { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
          { name: "O3 Mini (Reasoning)", value: "o3-mini" },
          { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash-001" },
          { name: "Gemini Pro", value: "gemini-pro" },
        ],
        default: "gpt-4o",
        description: "AI model to use for text generation",
        required: true,
      },
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        typeOptions: {
          rows: 4,
        },
        default: "",
        description: "The prompt for text generation",
        required: true,
      },
      {
        displayName: "System Message",
        name: "systemMessage",
        type: "string",
        typeOptions: {
          rows: 3,
        },
        default: "",
        description: "System message to guide the AI behavior (optional)",
        required: false,
      },
      {
        displayName: "Temperature",
        name: "temperature",
        type: "number",
        default: 0.7,
        description: "Controls randomness (0.0 = deterministic, 1.0 = random)",
        typeOptions: {
          minValue: 0,
          maxValue: 2,
          numberPrecision: 1,
        },
      },
      {
        displayName: "Max Tokens",
        name: "maxTokens",
        type: "number",
        default: 1000,
        description: "Maximum number of tokens to generate",
        typeOptions: {
          minValue: 1,
          maxValue: 8000,
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const textModel = this.getNodeParameter("textModel", i) as string;
      const prompt = this.getNodeParameter("prompt", i) as string;
      const systemMessage = this.getNodeParameter("systemMessage", i) as string;
      const temperature = this.getNodeParameter("temperature", i) as number;
      const maxTokens = this.getNodeParameter("maxTokens", i) as number;

      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      try {
        console.log("Generating text with model:", textModel);

        // Generate text using Creative Suite API
        const textResponse = await axios.post(
          `${apiUrl}/trpc/generation.generateText`,
          {
            model: textModel,
            prompt,
            systemMessage,
            temperature,
            maxTokens,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 120000, // 2 minute timeout
          },
        );

        if (!textResponse.data?.result?.data) {
          throw new Error("Failed to generate text");
        }

        const generatedText = textResponse.data.result.data.text;
        const usage = textResponse.data.result.data.usage;

        const responseData = {
          success: true,
          generatedText,
          model: textModel,
          usage,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: textModel,
            prompt,
            temperature,
            maxTokens,
          },
        };

        returnData.push({
          json: responseData,
        });
      } catch (error: any) {
        console.error("GenerateText Error:", error);

        const errorData = {
          success: false,
          error: {
            message: error.message || "Unknown error occurred",
            status: error.response?.status,
            data: error.response?.data,
          },
          input: {
            textModel,
            prompt,
            temperature,
            maxTokens,
          },
        };

        returnData.push({
          json: errorData,
        });
      }
    }

    return [returnData];
  }
}
