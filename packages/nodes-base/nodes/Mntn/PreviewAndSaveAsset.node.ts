import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class PreviewAndSaveAsset implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Preview and Save Asset",
    name: "previewAndSaveAsset",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    description:
      "Standalone asset preview and save - works anywhere, no project/brand context required",
    defaults: {
      name: "Preview and Save Asset",
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
        displayName: "Input Type",
        name: "inputType",
        type: "options",
        options: [
          { name: "Direct URL", value: "url" },
          { name: "From Previous Node (Binary)", value: "binary" },
          { name: "Cloudinary Public ID", value: "cloudinary" },
          { name: "Google Cloud Storage Path", value: "gcs" },
        ],
        default: "url",
        description: "Source type of the asset to preview and save",
      },
      // URL Input
      {
        displayName: "Asset URL",
        name: "assetUrl",
        type: "string",
        default: "",
        placeholder: "https://example.com/image.jpg",
        displayOptions: {
          show: {
            inputType: ["url"],
          },
        },
        description: "Direct URL to the asset",
        required: true,
      },
      // Binary Input
      {
        displayName: "Binary Property Name",
        name: "binaryProperty",
        type: "string",
        default: "data",
        displayOptions: {
          show: {
            inputType: ["binary"],
          },
        },
        description: "Name of the binary property from previous node",
        required: true,
      },
      // Asset Configuration
      {
        displayName: "Asset Configuration",
        name: "assetSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Asset Type",
        name: "assetType",
        type: "options",
        options: [
          { name: "Image", value: "image" },
          { name: "Video", value: "video" },
          { name: "Audio", value: "audio" },
          { name: "Logo", value: "logo" },
          { name: "Font", value: "font" },
        ],
        default: "image",
        description: "Type of asset being saved",
        required: true,
      },
      {
        displayName: "Asset Name",
        name: "assetName",
        type: "string",
        default: "",
        description: "Custom name for the asset (auto-generated if empty)",
      },
      {
        displayName: "Source",
        name: "source",
        type: "string",
        default: "preview-node",
        description: "Source identifier for the asset",
      },
      // Preview Options
      {
        displayName: "Preview Options",
        name: "previewSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Preview Binary Property Name",
        name: "previewPropertyName",
        type: "string",
        default: "preview",
        description: "Name for the binary property containing the preview",
      },
      {
        displayName: "Enable Preview Optimization",
        name: "enablePreviewOptimization",
        type: "boolean",
        default: true,
        description:
          "Apply optimization for preview (smaller size, web-friendly format for images)",
      },
      // Advanced
      {
        displayName: "Advanced",
        name: "advancedSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Asset Metadata",
        name: "assetMeta",
        type: "json",
        default: "{}",
        description: "Additional metadata to store with the asset",
      },
      {
        displayName: "Is Demo Asset",
        name: "isDemo",
        type: "boolean",
        default: false,
        description: "Mark this asset as a demo asset",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputType = this.getNodeParameter("inputType", i) as string;
      const assetType = this.getNodeParameter("assetType", i) as string;
      const assetName = this.getNodeParameter("assetName", i) as string;
      const source = this.getNodeParameter("source", i) as string;
      const previewPropertyName = this.getNodeParameter(
        "previewPropertyName",
        i,
      ) as string;
      const enablePreviewOptimization = this.getNodeParameter(
        "enablePreviewOptimization",
        i,
      ) as boolean;
      const assetMetaStr = this.getNodeParameter("assetMeta", i) as string;
      const isDemo = this.getNodeParameter("isDemo", i) as boolean;

      // Parse metadata
      let assetMeta = {};
      try {
        assetMeta = assetMetaStr ? JSON.parse(assetMetaStr) : {};
      } catch (e) {
        console.warn("Invalid JSON in asset metadata, using empty object");
      }

      // Get credentials
      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      try {
        let assetUrl: string;
        let fileName: string | undefined;

        // Prepare asset URL based on input type
        switch (inputType) {
          case "url":
            assetUrl = this.getNodeParameter("assetUrl", i) as string;
            break;

          case "binary":
            const binaryProperty = this.getNodeParameter(
              "binaryProperty",
              i,
            ) as string;
            const binaryData = items[i].binary?.[binaryProperty];
            if (!binaryData) {
              throw new Error(
                `No binary data found at property "${binaryProperty}"`,
              );
            }

            // Convert binary to data URL for our API
            const binaryBuffer = await this.helpers.getBinaryDataBuffer(
              i,
              binaryProperty,
            );
            const mimeType = binaryData.mimeType || "application/octet-stream";
            assetUrl = `data:${mimeType};base64,${binaryBuffer.toString("base64")}`;
            fileName = binaryData.fileName;
            break;

          default:
            throw new Error(`Unsupported input type: ${inputType}`);
        }

        console.log("Preview and Save Asset (standalone):", {
          inputType,
          assetType,
          hasAssetUrl: !!assetUrl,
          source,
        });

        // Save asset using Creative Suite API
        const saveAssetResponse = await axios.post(
          `${apiUrl}/trpc/assets.previewAndSaveAsset`,
          {
            assetUrl,
            assetType,
            name: assetName,
            source,
            meta: assetMeta,
            isDemo,
            fileName,
            enablePreviewOptimization,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 300000, // 5 minute timeout
          },
        );

        if (!saveAssetResponse.data?.result?.data) {
          throw new Error("Failed to save asset via Creative Suite API");
        }

        const savedAsset = saveAssetResponse.data.result.data.asset;
        const previewData = saveAssetResponse.data.result.data.preview;
        const cloudinaryUrl = saveAssetResponse.data.result.data.cloudinaryUrl;

        // Prepare binary data for n8n preview
        let binaryData = {};
        if (previewData && previewData.buffer) {
          const previewBuffer = Buffer.from(previewData.buffer, "base64");

          let finalFileName =
            previewData.fileName ||
            savedAsset.fileName ||
            `asset-${savedAsset.assetId}`;
          let finalMimeType = previewData.mimeType || savedAsset.fileType;

          const binary = await this.helpers.prepareBinaryData(
            previewBuffer,
            finalFileName,
            finalMimeType,
          );

          binaryData = { [previewPropertyName]: binary };
        }

        const responseData = {
          success: true,
          inputType,
          asset: {
            assetId: savedAsset.assetId,
            fileName: savedAsset.fileName,
            fileType: savedAsset.fileType,
            storagePath: savedAsset.storagePath,
            s3Path: savedAsset.s3Path,
            meta: savedAsset.meta,
            createTime: savedAsset.createTime,
            assetFiles: savedAsset.assetFiles,
            cloudinaryUrl,
          },
          preview: {
            available: !!previewData,
            propertyName: previewPropertyName,
            fileName: previewData?.fileName,
            mimeType: previewData?.mimeType,
            size: previewData?.size,
          },
          context: {
            standalone: true,
            note: "Asset saved without project/brand associations",
          },
          metadata: {
            savedAt: new Date().toISOString(),
            source,
            isDemo,
          },
        };

        returnData.push({
          json: responseData,
          binary: binaryData,
        });
      } catch (error: any) {
        console.error("PreviewAndSaveAsset Error:", error);

        const errorData = {
          success: false,
          inputType,
          error: {
            message: error.message || "Unknown error occurred",
            status: error.response?.status,
            data: error.response?.data,
          },
          context: {
            standalone: true,
            note: "Asset saving failed",
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
