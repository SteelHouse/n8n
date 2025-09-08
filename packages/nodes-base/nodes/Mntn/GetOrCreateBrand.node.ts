import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class GetOrCreateBrand implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Get or Create Brand",
    name: "getOrCreateBrand",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    description: "Get or create a brand based on website URL",
    defaults: {
      name: "Get or Create Brand",
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
        displayName: "Brand Website",
        name: "brandWebsite",
        type: "string",
        default: "",
        description: "The brand website URL to get or create brand from",
        required: true,
      },
      {
        displayName: "Duration",
        name: "duration",
        type: "options",
        options: [
          {
            name: "15 seconds",
            value: "15",
          },
          {
            name: "30 seconds",
            value: "30",
          },
        ],
        default: "15",
        description: "Duration for project naming",
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const brandWebsite = this.getNodeParameter("brandWebsite", i) as string;
      const duration = this.getNodeParameter("duration", i) as string;

      // Get credentials from n8n
      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;
      const workspaceId = credentials.workspaceId as number;
      const userId = credentials.userId as number;

      try {
        // Step 1: Get or create brand
        const brandResponse = await axios.post(
          `${apiUrl}/trpc/models.getOrCreateBrand`,
          {
            brandWebsite,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!brandResponse.data?.result?.data?.success) {
          throw new Error("Failed to get or create brand");
        }

        const brand = brandResponse.data.result.data.result.brand;

        const responseData = {
          success: true,
          input: {
            brandWebsite,
            duration,
          },
          brand,
          workspaceId,
          userId,
        };

        returnData.push({
          json: responseData,
        });
      } catch (error: any) {
        // Return error information but don't throw to keep workflow running
        const errorData = {
          success: false,
          error: {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          },
          input: {
            brandWebsite,
            duration,
          },
          workspaceId,
          userId,
        };

        returnData.push({
          json: errorData,
        });
      }
    }

    return [returnData];
  }
}
