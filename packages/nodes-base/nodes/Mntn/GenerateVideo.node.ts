import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class GenerateVideo implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Generate Video",
    name: "generateVideo",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    description:
      "Generate videos using AI models with automatic transcription and asset saving",
    defaults: {
      name: "Generate Video",
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
        displayName: "Video Model",
        name: "videoModel",
        type: "options",
        options: [
          { name: "Google Veo 3.0 Fast", value: "veo-3" },
          { name: "Google Veo 2.0", value: "veo-2" },
          { name: "Getty Stock Videos", value: "getty-videos" },
        ],
        default: "veo-3",
        description: "AI model to use for video generation",
        required: true,
      },
      {
        displayName: "Generation Type",
        name: "generationType",
        type: "options",
        options: [
          { name: "Text to Video", value: "text-to-video" },
          { name: "Image to Video", value: "image-to-video" },
        ],
        default: "text-to-video",
        description: "Type of video generation",
        required: true,
      },
      {
        displayName: "Text Prompt",
        name: "textPrompt",
        type: "string",
        typeOptions: {
          rows: 4,
        },
        default: "",
        displayOptions: {
          show: {
            generationType: ["text-to-video", "image-to-video"],
          },
        },
        description: "Description of the video to generate",
        required: true,
      },
      {
        displayName: "Source Image URL",
        name: "sourceImageUrl",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            generationType: ["image-to-video"],
          },
        },
        description: "URL of the source image for image-to-video generation",
        required: true,
      },
      {
        displayName: "Video Settings",
        name: "videoSettingsSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Duration (seconds)",
        name: "duration",
        type: "number",
        default: 8,
        description: "Duration of video to generate (in seconds)",
        typeOptions: {
          minValue: 1,
          maxValue: 8,
        },
      },
      {
        displayName: "Video Size",
        name: "videoSize",
        type: "options",
        options: [
          { name: "Square (1024x1024)", value: "1024x1024" },
          { name: "Portrait (1080x1920)", value: "1080x1920" },
          { name: "Landscape (1920x1080)", value: "1920x1080" },
          { name: "HD (1280x720)", value: "1280x720" },
          { name: "4K (3840x2160)", value: "3840x2160" },
        ],
        default: "1920x1080",
        description: "Resolution of the generated video",
      },
      {
        displayName: "Frame Rate",
        name: "frameRate",
        type: "options",
        options: [
          { name: "24 FPS", value: 24 },
          { name: "30 FPS", value: 30 },
          { name: "60 FPS", value: 60 },
        ],
        default: 30,
        description: "Frame rate of the generated video",
      },
      {
        displayName: "Video Quality",
        name: "videoQuality",
        type: "options",
        options: [
          { name: "Draft", value: "draft" },
          { name: "Standard", value: "standard" },
          { name: "High", value: "high" },
          { name: "Ultra", value: "ultra" },
        ],
        default: "high",
        description: "Quality setting for video generation",
      },
      {
        displayName: "Auto Save Options",
        name: "autoSaveSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Asset Name",
        name: "assetName",
        type: "string",
        default: "",
        description:
          "Custom name for the generated video asset (auto-generated if empty)",
      },
      {
        displayName: "Preview Property Name",
        name: "previewPropertyName",
        type: "string",
        default: "videoPreview",
        description:
          "Name for the binary property containing the video preview",
      },
      {
        displayName: "Asset Metadata",
        name: "assetMeta",
        type: "json",
        default: "{}",
        description: "Additional metadata to store with the video asset",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      // Preserve adCode if it exists in input for downstream nodes
      const inputData = items[i].json;
      const preservedAdCode = inputData?.adCode
        ? { adCode: inputData.adCode }
        : {};
      const videoModel = this.getNodeParameter("videoModel", i) as string;
      const generationType = this.getNodeParameter(
        "generationType",
        i,
      ) as string;
      const textPrompt = this.getNodeParameter("textPrompt", i) as string;
      const sourceImageUrl =
        generationType === "image-to-video"
          ? (this.getNodeParameter("sourceImageUrl", i) as string)
          : "";
      const duration = this.getNodeParameter("duration", i) as number;
      const videoSize = this.getNodeParameter("videoSize", i) as string;
      const frameRate = this.getNodeParameter("frameRate", i) as number;
      const videoQuality = this.getNodeParameter("videoQuality", i) as string;
      const seed = this.getNodeParameter("seed", i) as number;
      const assetName = this.getNodeParameter("assetName", i) as string;
      const previewPropertyName = this.getNodeParameter(
        "previewPropertyName",
        i,
      ) as string;
      const assetMetaStr = this.getNodeParameter("assetMeta", i) as string;

      let assetMeta = {};
      try {
        assetMeta = assetMetaStr ? JSON.parse(assetMetaStr) : {};
      } catch (e) {
        console.warn("Invalid JSON in asset metadata, using empty object");
      }

      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      try {
        console.log("Generating video with model:", videoModel);

        // Parse video dimensions
        const [width, height] = videoSize.split("x").map(Number);

        // Generate video using Creative Suite API
        const videoResponse = await axios.post(
          `${apiUrl}/trpc/generation.generateVideo`,
          {
            model: videoModel,
            generationType,
            textPrompt,
            sourceImageUrl:
              generationType === "image-to-video" ? sourceImageUrl : undefined,
            duration,
            width,
            height,
            frameRate,
            videoQuality,
            seed: seed === -1 ? undefined : seed,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 600000, // 10 minute timeout for video generation
          },
        );

        if (!videoResponse.data?.result?.data) {
          throw new Error("Failed to generate video");
        }

        const responseData = videoResponse.data.result.data;
        const generatedVideo = responseData.generatedVideo || responseData;

        if (!generatedVideo?.videoUrl) {
          console.warn("No video URL in response:", responseData);
          throw new Error("No video was generated or invalid response format");
        }

        console.log("Video generated successfully:", generatedVideo.videoUrl);

        // Auto-save to asset library
        let savedAsset = null;
        let previewData = null;

        if (generatedVideo.videoUrl) {
          try {
            const saveResponse = await axios.post(
              `${apiUrl}/trpc/assets.previewAndSaveAsset`,
              {
                assetUrl: generatedVideo.videoUrl,
                assetType: "video",
                name: assetName || `generated-video-${Date.now()}`,
                source: "video-generation-node",
                generateVideoPreview: true,
                meta: {
                  ...assetMeta,
                  model: videoModel,
                  generationType,
                  textPrompt,
                  sourceImageUrl,
                  duration: generatedVideo.duration,
                  dimensions: { width, height },
                  frameRate,
                  videoQuality,
                  seed: generatedVideo.seed,
                  generatedAt: new Date().toISOString(),
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                timeout: 180000,
              },
            );

            if (saveResponse.data?.result?.data?.asset) {
              savedAsset = saveResponse.data.result.data.asset;
              previewData = saveResponse.data.result.data.preview;
              console.log(
                `Video auto-saved with asset ID: ${savedAsset.assetId}`,
              );
            }
          } catch (error: any) {
            console.warn(`Failed to auto-save video asset: ${error.message}`);
          }
        }

        // Prepare binary data for preview
        let binaryData = {};
        if (previewData && previewData.buffer) {
          try {
            const previewBuffer = Buffer.from(previewData.buffer, "base64");
            let finalFileName =
              previewData.fileName ||
              `generated-video-${savedAsset?.assetId || Date.now()}`;
            let finalMimeType = previewData.mimeType || "video/mp4";

            if (!finalFileName.toLowerCase().endsWith(".mp4")) {
              finalFileName = finalFileName.replace(/\.[^.]*$/, "") + ".mp4";
            }

            const binary = await this.helpers.prepareBinaryData(
              previewBuffer,
              finalFileName,
              finalMimeType,
            );

            binaryData = { [previewPropertyName]: binary };

            console.log(
              `Video preview prepared: ${finalFileName}, size: ${(previewBuffer.length / 1024 / 1024).toFixed(2)}MB`,
            );
          } catch (previewError: any) {
            console.warn(
              `Failed to prepare video preview: ${previewError.message}`,
            );
          }
        }

        const result = {
          success: true,
          generatedVideo,
          asset: savedAsset,
          preview: {
            available: !!previewData,
            propertyName: previewPropertyName,
            fileName: previewData?.fileName,
            mimeType: previewData?.mimeType,
            size: previewData?.size,
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            model: videoModel,
            generationType,
            duration: generatedVideo.duration,
            dimensions: { width, height },
            frameRate,
            autoSaved: !!savedAsset,
          },
        };

        returnData.push({
          json: { ...result, ...preservedAdCode },
          binary: binaryData,
        });
      } catch (error: any) {
        console.error("GenerateVideo Error:", error);

        const errorData = {
          success: false,
          error: {
            message: error.message || "Unknown error occurred",
            status: error.response?.status,
            data: error.response?.data,
          },
          input: {
            videoModel,
            generationType,
            textPrompt,
            duration,
            videoSize,
          },
        };

        returnData.push({
          json: { ...errorData, ...preservedAdCode },
        });
      }
    }

    return [returnData];
  }
}
