import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class InitializeAdCode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Initialize AdCode",
    name: "initializeAdCode",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] || "Create new AdCode"}}',
    description: "Initialize a new AdCode structure for video generation",
    defaults: {
      name: "Initialize AdCode",
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
        displayName: "Video Width",
        name: "width",
        type: "number",
        default: 1920,
        description: "Width of the video in pixels",
      },
      {
        displayName: "Video Height",
        name: "height",
        type: "number",
        default: 1080,
        description: "Height of the video in pixels",
      },
      {
        displayName: "FPS",
        name: "fps",
        type: "number",
        default: 30,
        description: "Frames per second for the video",
      },
      {
        displayName: "Duration (seconds)",
        name: "durationInSeconds",
        type: "number",
        default: 30,
        description: "Total duration of the video in seconds",
      },
      {
        displayName: "Background Color",
        name: "backgroundColor",
        type: "color",
        default: "#000000",
        description: "Background color for the underlay",
      },
      {
        displayName: "Theme",
        name: "theme",
        type: "options",
        options: [
          {
            name: "Light",
            value: "light",
          },
          {
            name: "Dark",
            value: "dark",
          },
        ],
        default: "dark",
        description: "Theme for the video",
      },
      {
        displayName: "Asset Type",
        name: "assetType",
        type: "options",
        options: [
          {
            name: "Video",
            value: "video",
          },
          {
            name: "Image",
            value: "image",
          },
          {
            name: "Mixed",
            value: "mixed",
          },
          {
            name: "Generative Video",
            value: "generative_video",
          },
        ],
        default: "video",
        description: "Primary asset type for this ad",
      },
      // Advanced Meta Properties
      {
        displayName: "Advanced Meta",
        name: "advancedMetaSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Recommended Voice IDs",
        name: "recommendedVoiceIds",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: "voiceId",
            displayName: "Voice ID",
            values: [
              {
                displayName: "Voice ID",
                name: "id",
                type: "string",
                default: "",
                description: "ElevenLabs or other TTS voice ID",
                required: false,
              },
            ],
          },
        ],
        description: "List of recommended voice IDs for voiceovers",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const width = this.getNodeParameter("width", i) as number;
      const height = this.getNodeParameter("height", i) as number;
      const fps = this.getNodeParameter("fps", i) as number;
      const durationInSeconds = this.getNodeParameter(
        "durationInSeconds",
        i,
      ) as number;
      const backgroundColor = this.getNodeParameter(
        "backgroundColor",
        i,
      ) as string;
      const theme = this.getNodeParameter("theme", i) as "light" | "dark";
      const assetType = this.getNodeParameter("assetType", i) as string;

      // Parse recommended voice IDs
      const recommendedVoiceIdsConfig = this.getNodeParameter(
        "recommendedVoiceIds",
        i,
      ) as {
        voiceId: Array<{ id: string }>;
      };
      const recommendedVoiceIds =
        recommendedVoiceIdsConfig.voiceId
          ?.map((item) => item.id.trim())
          .filter((id) => id.length > 0) || [];

      // Create the adCode structure
      const adCode = {
        meta: {
          version: "2.0",
          createdAt: new Date().toISOString(),
          createdBy: "n8n-workflow",
          ...(recommendedVoiceIds.length > 0 && { recommendedVoiceIds }),
        },
        output: {
          width,
          height,
          fps,
          durationInSeconds,
          availableSizes: [
            { width, height },
            { width: 1080, height: 1920 }, // Portrait
            { width: 1080, height: 1080 }, // Square
          ],
          assetType,
          theme,
        },
        scenes: {
          id: "scenes",
          type: "scenes",
          scenes: [],
        },
        overlay: {
          id: "overlay",
          type: "overlay",
          elements: [],
        },
        underlay: {
          id: "underlay",
          type: "underlay",
          elements: [],
          props: {
            style: {
              backgroundColor,
            },
          },
        },
      };

      // Get execution ID for Redis storage
      const executionId = this.getExecutionId();

      // REDIS ONLY: Store adCode in Redis
      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      await axios.post(
        `${apiUrl}/trpc/n8n.storeExecutionAdCode`,
        { executionId, adCode },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
        },
      );

      console.log(
        `[InitializeAdCode] Stored adCode in Redis for execution ${executionId}`,
      );

      returnData.push({
        json: {
          success: true,
          executionId,
          adCodeInitialized: true,
          meta: {
            nodeType: "initializeAdCode",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return [returnData];
  }
}
