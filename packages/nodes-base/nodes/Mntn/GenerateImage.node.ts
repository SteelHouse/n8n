import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class GenerateImage implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Generate Image",
    name: "generateImage",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    description: "Generate images using AI models with automatic asset saving",
    defaults: {
      name: "Generate Image",
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
        displayName: "Image Model",
        name: "imageModel",
        type: "options",
        options: [
          {
            name: "Google Gemini 2.5 Flash Image (Nano Banana)",
            value: "gemini-2.5-flash-image",
          },
          { name: "Google Imagen 4.0", value: "imagen-4" },
          { name: "Google Imagen 3.0 (Editing)", value: "imagen-3" },
          { name: "Amazon Nova Canvas", value: "nova-canvas" },
          { name: "Getty Stock Images", value: "getty-images" },
        ],
        default: "gemini-2.5-flash-image",
        description: "AI model to use for image generation",
        required: true,
      },
      {
        displayName: "Generation Type",
        name: "generationType",
        type: "options",
        options: [
          { name: "Text to Image", value: "text-to-image" },
          { name: "Image Editing", value: "image-editing" },
          { name: "Multi-Image Composition", value: "multi-image-composition" },
          { name: "Iterative Refinement", value: "iterative-refinement" },
        ],
        default: "text-to-image",
        description: "Type of image generation to perform",
        displayOptions: {
          show: {
            imageModel: ["gemini-2.5-flash-image"],
          },
        },
      },
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        typeOptions: {
          rows: 4,
        },
        default: "",
        description: "Description of the image to generate",
        required: true,
      },
      {
        displayName: "Negative Prompt",
        name: "negativePrompt",
        type: "string",
        typeOptions: {
          rows: 2,
        },
        default: "",
        description:
          "What to avoid in the generated image (not supported by all models)",
        required: false,
      },
      {
        displayName: "Image Style",
        name: "imageStyle",
        type: "options",
        options: [
          { name: "Natural", value: "natural" },
          { name: "Vivid", value: "vivid" },
          { name: "Photographic", value: "photographic" },
          { name: "Artistic", value: "artistic" },
          { name: "Cartoon/Anime", value: "cartoon" },
          { name: "Abstract", value: "abstract" },
          { name: "Realistic", value: "realistic" },
          { name: "Cinematic", value: "cinematic" },
        ],
        default: "natural",
        description: "Style for the generated image",
      },
      {
        displayName: "Image Size",
        name: "imageSize",
        type: "options",
        options: [
          { name: "Square (1024x1024)", value: "1024x1024" },
          { name: "Portrait (1024x1792)", value: "1024x1792" },
          { name: "Landscape (1792x1024)", value: "1792x1024" },
          { name: "HD (1280x720)", value: "1280x720" },
          { name: "Full HD (1920x1080)", value: "1920x1080" },
          { name: "4K (3840x2160)", value: "3840x2160" },
          { name: "Instagram Square (1080x1080)", value: "1080x1080" },
          { name: "Instagram Story (1080x1920)", value: "1080x1920" },
        ],
        default: "1024x1024",
        description: "Size/resolution of the generated image",
      },
      {
        displayName: "Number of Images",
        name: "numberOfImages",
        type: "number",
        default: 1,
        description: "Number of images to generate",
        typeOptions: {
          minValue: 1,
          maxValue: 10,
        },
      },
      {
        displayName: "Quality",
        name: "quality",
        type: "options",
        options: [
          { name: "Standard", value: "standard" },
          { name: "High", value: "hd" },
          { name: "Ultra", value: "ultra" },
        ],
        default: "standard",
        description: "Quality setting for image generation",
      },
      {
        displayName: "Advanced Settings",
        name: "advancedSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Seed",
        name: "seed",
        type: "number",
        default: -1,
        description: "Seed for reproducible results (-1 for random)",
        typeOptions: {
          minValue: -1,
          maxValue: 4294967295,
        },
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
          "Custom name for the generated image asset (auto-generated if empty)",
      },
      {
        displayName: "Preview Property Name",
        name: "previewPropertyName",
        type: "string",
        default: "imagePreview",
        description:
          "Name for the binary property containing the image preview",
      },
      {
        displayName: "Asset Metadata",
        name: "assetMeta",
        type: "json",
        default: "{}",
        description: "Additional metadata to store with the image asset",
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
      const imageModel = this.getNodeParameter("imageModel", i) as string;
      const prompt = this.getNodeParameter("prompt", i) as string;
      const negativePrompt = this.getNodeParameter(
        "negativePrompt",
        i,
      ) as string;
      const imageStyle = this.getNodeParameter("imageStyle", i) as string;
      const imageSize = this.getNodeParameter("imageSize", i) as string;
      const numberOfImages = this.getNodeParameter(
        "numberOfImages",
        i,
      ) as number;
      const quality = this.getNodeParameter("quality", i) as string;
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
        // Parse image dimensions
        const [width, height] = imageSize.split("x").map(Number);

        // Prepare request body
        const requestBody: any = {
          model: imageModel,
          prompt,
          negativePrompt: negativePrompt || undefined,
          imageStyle,
          width,
          height,
          numberOfImages,
          quality,
          seed: seed === -1 ? undefined : seed,
        };

        console.log(
          `Generating ${imageModel} image`,
        );

        // Generate image using Creative Suite API
        const imageResponse = await axios.post(
          `${apiUrl}/trpc/generation.generateImage`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 300000, // 5 minute timeout for image generation
          },
        );

        if (!imageResponse.data?.result?.data) {
          throw new Error(
            "Failed to generate image - no result data in response",
          );
        }

        const responseData = imageResponse.data.result.data;
        
        // Handle different response formats from different models
        let generatedImages = [];
        if (responseData.images) {
          generatedImages = responseData.images;
        } else if (responseData.generatedImages) {
          generatedImages = responseData.generatedImages;
        } else if (responseData.success && responseData.images) {
          generatedImages = responseData.images;
        } else if (responseData.success === false) {
          throw new Error(
            `Image generation failed: ${responseData.error || "Unknown error"}`,
          );
        } else {
          throw new Error(
            `Invalid response format - no images found. Response keys: ${Object.keys(responseData)}`,
          );
        }

        if (!Array.isArray(generatedImages) || generatedImages.length === 0) {
          throw new Error(
            `No images were generated. Response: ${JSON.stringify(responseData)}`,
          );
        }

        const savedAssets: any[] = [];
        const binaryData: any = {};

        console.log(`Processing ${generatedImages.length} generated images`);

        // Process each generated image
        for (let imgIndex = 0; imgIndex < generatedImages.length; imgIndex++) {
          const image = generatedImages[imgIndex];

          // Auto-save each image to asset library
          let savedAsset = null;
          let previewData = null;

          if (image.url) {
            try {
              const saveResponse = await axios.post(
                `${apiUrl}/trpc/assets.previewAndSaveAsset`,
                {
                  assetUrl: image.url,
                  assetType: "image",
                  name:
                    assetName ||
                    `generated-image-${Date.now()}-${imgIndex + 1}`,
                  source: "image-generation-node",
                  enablePreviewOptimization: true,
                  meta: {
                    ...assetMeta,
                    model: imageModel,
                    prompt,
                    negativePrompt,
                    imageStyle,
                    width,
                    height,
                    quality,
                    seed: image.seed,
                    generatedAt: new Date().toISOString(),
                    imageIndex: imgIndex + 1,
                    totalImages: generatedImages.length,
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
                const cloudinaryUrl =
                  savedAsset.url ||
                  savedAsset.cloudinaryUrl ||
                  savedAsset.assetUrl;
                console.log(
                  `Image ${imgIndex + 1} saved - Asset ID: ${savedAsset.assetId}, URL: ${cloudinaryUrl}`,
                );
              }
            } catch (error: any) {
              console.warn(
                `Failed to auto-save image ${imgIndex + 1}: ${error.message}`,
              );
            }
          }

          savedAssets.push(savedAsset);

          // Prepare binary data for preview (only first image to avoid clutter)
          if (imgIndex === 0 && previewData && previewData.buffer) {
            try {
              const previewBuffer = Buffer.from(previewData.buffer, "base64");
              let finalFileName =
                previewData.fileName ||
                `generated-image-${savedAsset?.assetId || Date.now()}`;
              let finalMimeType = previewData.mimeType || "image/jpeg";

              if (!finalFileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                finalFileName = finalFileName.replace(/\.[^.]*$/, "") + ".jpg";
              }

              const binary = await this.helpers.prepareBinaryData(
                previewBuffer,
                finalFileName,
                finalMimeType,
              );

              binaryData[previewPropertyName] = binary;

              console.log(`Preview prepared: ${finalFileName}`);
            } catch (previewError: any) {
              console.warn(
                `Failed to prepare image preview: ${previewError.message}`,
              );
            }
          }
        }

        const result = {
          success: true,
          generatedImages: generatedImages.map((img: any, idx: number) => ({
            ...img,
            asset: savedAssets[idx],
          })),
          assets: savedAssets.filter(Boolean),
          preview: {
            available: Object.keys(binaryData).length > 0,
            propertyName: previewPropertyName,
            totalImages: generatedImages.length,
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            model: imageModel,
            prompt,
            imageStyle,
            dimensions: { width, height },
            numberOfImages: generatedImages.length,
            autoSaved: savedAssets.filter(Boolean).length,
          },
        };

        returnData.push({
          json: { ...result, ...preservedAdCode },
          binary: binaryData,
        });
      } catch (error: any) {
        console.error("GenerateImage Error:", error);

        const errorData = {
          success: false,
          error: {
            message: error.message || "Unknown error occurred",
            status: error.response?.status,
            data: error.response?.data,
          },
          input: {
            imageModel,
            prompt,
            imageStyle,
            imageSize,
            numberOfImages,
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
