import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class GenerateAudio implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - Generate Audio",
    name: "generateAudio",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    description:
      "Generate audio using AI models with automatic transcription and asset saving",
    defaults: {
      name: "Generate Audio",
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
        displayName: "Audio Model",
        name: "audioModel",
        type: "options",
        options: [
          { name: "ElevenLabs (Text-to-Speech)", value: "elevenlabs" },
          { name: "WellSaid Labs (Text-to-Speech)", value: "wellsaid" },
          { name: "StabilityAI (Music)", value: "stabilityai-music" },
        ],
        default: "elevenlabs",
        description: "AI model to use for audio generation",
        required: true,
      },
      {
        displayName: "Generation Type",
        name: "generationType",
        type: "options",
        options: [
          { name: "Text-to-Speech", value: "tts" },
          { name: "Music Generation", value: "music" },
          { name: "Voice Cloning", value: "voice-clone" },
        ],
        default: "tts",
        description: "Type of audio to generate",
        required: true,
      },
      {
        displayName: "Text Input",
        name: "textInput",
        type: "string",
        typeOptions: {
          rows: 4,
        },
        default: "",
        displayOptions: {
          show: {
            generationType: ["tts", "voice-clone"],
          },
        },
        description: "Text to convert to speech",
        required: true,
      },
      {
        displayName: "Music Prompt",
        name: "musicPrompt",
        type: "string",
        typeOptions: {
          rows: 3,
        },
        default: "",
        displayOptions: {
          show: {
            generationType: ["music"],
          },
        },
        description: "Description of the music to generate",
        required: true,
      },
      {
        displayName: "Voice ID",
        name: "voiceId",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            generationType: ["tts", "voice-clone"],
            audioModel: ["elevenlabs"],
          },
        },
        description: "ElevenLabs voice ID (optional, uses default if empty)",
      },
      {
        displayName: "Duration (seconds)",
        name: "duration",
        type: "number",
        default: 30,
        displayOptions: {
          show: {
            generationType: ["music"],
          },
        },
        description: "Duration of music to generate",
        typeOptions: {
          minValue: 1,
          maxValue: 300,
        },
      },
      {
        displayName: "Audio Quality",
        name: "audioQuality",
        type: "options",
        options: [
          { name: "Standard", value: "standard" },
          { name: "High", value: "high" },
          { name: "Ultra", value: "ultra" },
        ],
        default: "high",
        description: "Audio quality setting",
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
          "Custom name for the generated audio asset (auto-generated if empty)",
      },
      {
        displayName: "Preview Property Name",
        name: "previewPropertyName",
        type: "string",
        default: "audioPreview",
        description:
          "Name for the binary property containing the audio preview",
      },
      {
        displayName: "Asset Metadata",
        name: "assetMeta",
        type: "json",
        default: "{}",
        description: "Additional metadata to store with the audio asset",
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
      const audioModel = this.getNodeParameter("audioModel", i) as string;
      const generationType = this.getNodeParameter(
        "generationType",
        i,
      ) as string;
      const textInput = ["tts", "voice-clone"].includes(generationType)
        ? (this.getNodeParameter("textInput", i) as string)
        : "";
      const musicPrompt =
        generationType === "music"
          ? (this.getNodeParameter("musicPrompt", i) as string)
          : "";
      const voiceId =
        ["tts", "voice-clone"].includes(generationType) &&
        audioModel === "elevenlabs"
          ? (this.getNodeParameter("voiceId", i) as string)
          : "";
      const duration =
        generationType === "music"
          ? (this.getNodeParameter("duration", i) as number)
          : 30;
      const audioQuality = this.getNodeParameter("audioQuality", i) as string;
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
        console.log("Generating audio with model:", audioModel);

        // Generate audio using Creative Suite API
        const audioResponse = await axios.post(
          `${apiUrl}/trpc/generation.generateAudio`,
          {
            model: audioModel,
            generationType,
            textInput:
              generationType === "tts" || generationType === "voice-clone"
                ? textInput
                : undefined,
            musicPrompt: generationType === "music" ? musicPrompt : undefined,
            voiceId,
            duration: generationType === "music" ? duration : undefined,
            audioQuality,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 300000, // 5 minute timeout for audio generation
          },
        );

        if (!audioResponse.data?.result?.data) {
          throw new Error("Failed to generate audio");
        }

        const responseData = audioResponse.data.result.data;
        const generatedAudio = responseData.generatedAudio || responseData;

        if (!generatedAudio?.audioUrl) {
          console.warn("No audio URL in response:", responseData);
          throw new Error("No audio was generated or invalid response format");
        }

        console.log("Audio generated successfully:", generatedAudio.audioUrl);

        // Auto-save to asset library
        let savedAsset = null;
        let previewData = null;

        if (generatedAudio.audioUrl) {
          try {
            const saveResponse = await axios.post(
              `${apiUrl}/trpc/assets.previewAndSaveAsset`,
              {
                assetUrl: generatedAudio.audioUrl,
                assetType: "audio",
                name: assetName || `generated-${generationType}-${Date.now()}`,
                source: "audio-generation-node",
                meta: {
                  ...assetMeta,
                  model: audioModel,
                  generationType,
                  textInput,
                  musicPrompt,
                  voiceId,
                  duration: generatedAudio.duration,
                  audioQuality,
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
                `Audio auto-saved with asset ID: ${savedAsset.assetId}`,
              );
            }
          } catch (error: any) {
            console.warn(`Failed to auto-save audio asset: ${error.message}`);
          }
        }

        // Prepare binary data for preview
        let binaryData = {};
        if (previewData && previewData.buffer) {
          try {
            const previewBuffer = Buffer.from(previewData.buffer, "base64");
            let finalFileName =
              previewData.fileName ||
              `${generationType}-${savedAsset?.assetId || Date.now()}`;
            let finalMimeType = previewData.mimeType || "audio/mpeg";

            if (!finalFileName.match(/\.(mp3|wav|ogg|m4a)$/i)) {
              finalFileName = finalFileName.replace(/\.[^.]*$/, "") + ".mp3";
            }

            const binary = await this.helpers.prepareBinaryData(
              previewBuffer,
              finalFileName,
              finalMimeType,
            );

            binaryData = { [previewPropertyName]: binary };

            console.log(
              `Audio preview prepared: ${finalFileName}, size: ${(previewBuffer.length / 1024).toFixed(1)}KB`,
            );
          } catch (previewError: any) {
            console.warn(
              `Failed to prepare audio preview: ${previewError.message}`,
            );
          }
        }

        const result = {
          success: true,
          generatedAudio,
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
            model: audioModel,
            generationType,
            duration: generatedAudio.duration,
            autoSaved: !!savedAsset,
          },
        };

        returnData.push({
          json: { ...result, ...preservedAdCode },
          binary: binaryData,
        });
      } catch (error: any) {
        console.error("GenerateAudio Error:", error);

        const errorData = {
          success: false,
          error: {
            message: error.message || "Unknown error occurred",
            status: error.response?.status,
            data: error.response?.data,
          },
          input: {
            audioModel,
            generationType,
            textInput,
            musicPrompt,
            voiceId,
            duration,
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
