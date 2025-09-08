import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class ReadAndOutputAdCode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Read and Output AdCode",
    name: "readAndOutputAdCode",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle: "Read AdCode from Redis",
    description: "Read the current AdCode object from Redis and output it",
    defaults: {
      name: "Read and Output AdCode",
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
        displayName: "Execution ID",
        name: "executionId",
        type: "string",
        default: "",
        description:
          "Optional execution ID to use for Redis operations. If empty, uses the current execution ID",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputData = items[i].json;

      // Get current adCode from Redis using the same pattern as other nodes
      const executionIdParam = this.getNodeParameter(
        "executionId",
        i,
      ) as string;
      const executionId = executionIdParam || this.getExecutionId();
      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      try {
        const response = await axios.get(
          `${apiUrl}/trpc/n8n.getExecutionAdCode?input=${encodeURIComponent(JSON.stringify({ executionId }))}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
          },
        );

        const adCode = response.data?.result?.data;
        if (!adCode) {
          throw new Error(
            "No adCode found in Redis. Please run Initialize AdCode node first.",
          );
        }

        console.log(
          `[ReadAndOutputAdCode] Retrieved adCode from Redis for execution ${executionId}`,
        );

        // Output the adCode with input data
        returnData.push({
          json: {
            ...inputData,
            adCode,
          },
        });
      } catch (error) {
        console.error(
          `[ReadAndOutputAdCode] Error reading adCode from Redis:`,
          error,
        );

        // Return error information
        returnData.push({
          json: {
            ...inputData,
            error:
              (error as Error).message || "Failed to read adCode from Redis",
          },
        });
      }
    }

    return [returnData];
  }
}
