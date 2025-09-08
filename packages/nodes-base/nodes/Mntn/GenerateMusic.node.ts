import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class GenerateMusic implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Generate Music",
    name: "generateMusic",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    description: "Generate background music for the ad using AI",
    defaults: {
      name: "Generate Music",
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
        displayName: "Music Description",
        name: "musicDescription",
        type: "string",
        default: "",
        description: "Music description/prompt for generation",
        required: true,
      },
      {
        displayName: "Duration (seconds)",
        name: "duration",
        type: "number",
        default: 15,
        description: "Duration of the music in seconds",
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const musicDescription = this.getNodeParameter(
        "musicDescription",
        i,
      ) as string;
      const duration = this.getNodeParameter("duration", i) as number;

      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      try {
        console.log("Generating music with description:", musicDescription);

        // Generate music using langChain endpoint
        const response = await axios.post(
          `${apiUrl}/trpc/langChain.generateMusic`,
          {
            musicDescription,
            duration,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 300000,
          },
        );

        if (!response.data?.result?.data) {
          throw new Error("Invalid response from generateMusic endpoint");
        }

        const generatedMusic = response.data.result.data;

        // Auto-save to asset library
        let savedAsset = null;
        let previewData = null;

        if (generatedMusic.musicUrl || generatedMusic.url) {
          const musicUrl = generatedMusic.musicUrl || generatedMusic.url;
          try {
            const saveResponse = await axios.post(
              `${apiUrl}/trpc/assets.previewAndSaveAsset`,
              {
                assetUrl: musicUrl,
                assetType: "audio",
                name: `generated-music-${Date.now()}`,
                source: "music-generation-node",
                meta: {
                  description: musicDescription,
                  duration: generatedMusic.lengthSeconds || duration,
                  provider: generatedMusic.provider,
                  generatedAt: new Date().toISOString(),
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                timeout: 120000,
              },
            );

            if (saveResponse.data?.result?.data?.asset) {
              savedAsset = saveResponse.data.result.data.asset;
              previewData = saveResponse.data.result.data.preview;
              console.log(
                `Music auto-saved with asset ID: ${savedAsset.assetId}`,
              );
            }
          } catch (error: any) {
            console.warn(`Failed to auto-save music asset: ${error.message}`);
          }
        }

        // Prepare binary data for preview
        let binaryData = {};
        if (previewData && previewData.buffer) {
          try {
            const previewBuffer = Buffer.from(previewData.buffer, "base64");
            let finalFileName =
              previewData.fileName ||
              `music-${savedAsset?.assetId || Date.now()}`;
            let finalMimeType = previewData.mimeType || "audio/mpeg";

            if (!finalFileName.match(/\.(mp3|wav|ogg|m4a)$/i)) {
              finalFileName = finalFileName.replace(/\.[^.]*$/, "") + ".mp3";
            }

            const binary = await this.helpers.prepareBinaryData(
              previewBuffer,
              finalFileName,
              finalMimeType,
            );

            binaryData = { musicPreview: binary };
          } catch (previewError: any) {
            console.warn(
              `Failed to prepare music preview: ${previewError.message}`,
            );
          }
        }

        returnData.push({
          json: {
            success: true,
            generatedMusic: generatedMusic,
            asset: savedAsset,
            music: {
              url:
                savedAsset?.cloudinaryUrl ||
                generatedMusic.musicUrl ||
                generatedMusic.url,
              duration: generatedMusic.lengthSeconds || duration,
              provider: generatedMusic.provider,
              description: musicDescription,
            },
            metadata: {
              generatedAt: new Date().toISOString(),
              provider: generatedMusic.provider,
              duration: generatedMusic.lengthSeconds || duration,
              autoSaved: !!savedAsset,
            },
          },
          binary: binaryData,
        });
      } catch (error: any) {
        console.error("GenerateMusic Error:", error);

        returnData.push({
          json: {
            success: false,
            error: {
              message: error.message || "Unknown error occurred",
              status: error.response?.status,
              data: error.response?.data,
            },
            input: {
              musicDescription,
              duration,
            },
          },
        });
      }
    }

    return [returnData];
  }
}
