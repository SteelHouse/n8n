import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";

export class AddAudioElement implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Add Audio Element",
    name: "addAudioElement",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle:
      '{{$parameter["audioType"]}} - {{$parameter["src"] || "Audio Element"}}',
    description:
      "Create an audio element object (use Attach Element to add to AdCode)",
    defaults: {
      name: "Add Audio Element",
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    properties: [
      {
        displayName: "Audio Type",
        name: "audioType",
        type: "options",
        options: [
          { name: "Music", value: "music" },
          { name: "Voiceover", value: "voiceover" },
        ],
        default: "music",
        description: "Type of audio content",
      },
      {
        displayName: "Audio Source URL",
        name: "src",
        type: "string",
        default: "",
        description:
          "URL or path to the audio file (optional - will use placeholder if empty)",
        required: false,
      },
      {
        displayName: "Asset ID",
        name: "assetId",
        type: "number",
        default: 0,
        description: "Internal asset ID for tracking",
      },
      {
        displayName: "Asset Name",
        name: "assetName",
        type: "string",
        default: "",
        description: "Name for the audio asset",
      },
      {
        displayName: "Start Frame",
        name: "from",
        type: "number",
        default: 0,
        description: "Frame when the audio should start playing",
      },
      {
        displayName: "Duration (frames)",
        name: "durationInFrames",
        type: "number",
        default: 900,
        description: "How long the audio should play (in frames)",
      },
      // Audio Properties
      {
        displayName: "Audio Settings",
        name: "audioSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Volume",
        name: "volume",
        type: "number",
        default: 1,
        description: "Volume level (0-1)",
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
      },
      {
        displayName: "Muted",
        name: "muted",
        type: "boolean",
        default: false,
        description: "Whether the audio should be muted",
      },
      {
        displayName: "Start From (seconds)",
        name: "startFrom",
        type: "number",
        default: 0,
        description: "Start playing from this time in the audio (seconds)",
        typeOptions: {
          minValue: 0,
          numberPrecision: 2,
        },
      },
      {
        displayName: "Fade In Duration (seconds)",
        name: "fadeIn",
        type: "number",
        default: 0,
        description: "Duration of fade in effect (seconds)",
        typeOptions: {
          minValue: 0,
          numberPrecision: 1,
        },
      },
      {
        displayName: "Fade Out Duration (seconds)",
        name: "fadeOut",
        type: "number",
        default: 0,
        description: "Duration of fade out effect (seconds)",
        typeOptions: {
          minValue: 0,
          numberPrecision: 1,
        },
      },
      // Voiceover-specific properties
      {
        displayName: "Voiceover Settings",
        name: "voiceoverSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            audioType: ["voiceover"],
          },
        },
      },
      {
        displayName: "Voiceover Script",
        name: "voiceoverScript",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            audioType: ["voiceover"],
          },
        },
        description: "Text script for the voiceover",
        typeOptions: {
          rows: 4,
        },
      },
      {
        displayName: "Voice ID",
        name: "voiceId",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            audioType: ["voiceover"],
          },
        },
        description: "Voice ID or name for the voiceover",
      },
      {
        displayName: "Language",
        name: "language",
        type: "options",
        options: [
          { name: "English", value: "en" },
          { name: "Spanish", value: "es" },
          { name: "French", value: "fr" },
          { name: "German", value: "de" },
          { name: "Italian", value: "it" },
          { name: "Portuguese", value: "pt" },
          { name: "Chinese", value: "zh" },
          { name: "Japanese", value: "ja" },
          { name: "Korean", value: "ko" },
        ],
        default: "en",
        displayOptions: {
          show: {
            audioType: ["voiceover"],
          },
        },
        description: "Language for the voiceover",
      },
      // Advanced Properties
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
        displayName: "Loop",
        name: "loop",
        type: "boolean",
        default: false,
        description: "Whether the audio should loop",
      },
      {
        displayName: "Preload",
        name: "preload",
        type: "options",
        options: [
          { name: "Auto", value: "auto" },
          { name: "Metadata", value: "metadata" },
          { name: "None", value: "none" },
        ],
        default: "metadata",
        description: "How much of the audio to preload",
      },
      {
        displayName: "Cross Origin",
        name: "crossOrigin",
        type: "options",
        options: [
          { name: "Anonymous", value: "anonymous" },
          { name: "Use Credentials", value: "use-credentials" },
          { name: "None", value: "" },
        ],
        default: "anonymous",
        description: "Cross-origin policy for the audio",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputData = items[i].json;
      const audioType = this.getNodeParameter("audioType", i) as
        | "music"
        | "voiceover";
      const inputSrc = this.getNodeParameter("src", i) as string;
      let finalAssetId = this.getNodeParameter("assetId", i) as number;
      let finalSrc =
        inputSrc || `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`;
      let isPlaceholder = !inputSrc || inputSrc.trim().length === 0;

      // Generate placeholder asset ID if needed
      if (!finalAssetId) {
        finalAssetId = Date.now() + Math.floor(Math.random() * 1000);
      }

      // Create unique ID for the element
      const elementId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const audioElement: any = {
        id: elementId,
        type: "audio" as const,
        src: finalSrc,
        assetId: finalAssetId,
        audioType,
        sequenceProps: {
          from: this.getNodeParameter("from", i) as number,
          durationInFrames: this.getNodeParameter(
            "durationInFrames",
            i,
          ) as number,
        },
        props: {
          volume: this.getNodeParameter("volume", i) as number,
          muted: this.getNodeParameter("muted", i) as boolean,
          startFrom: this.getNodeParameter("startFrom", i) as number,
          loop: this.getNodeParameter("loop", i) as boolean,
          preload: this.getNodeParameter("preload", i) as string,
          crossOrigin: this.getNodeParameter("crossOrigin", i) as string,
        },
        animations: [],
        groupId: undefined,
        meta: {
          isPlaceholder,
          assetName: this.getNodeParameter("assetName", i) as string,
        },
      };

      // Add fade effects if specified
      const fadeIn = this.getNodeParameter("fadeIn", i) as number;
      const fadeOut = this.getNodeParameter("fadeOut", i) as number;
      if (fadeIn > 0 || fadeOut > 0) {
        audioElement.props.fadeIn = fadeIn;
        audioElement.props.fadeOut = fadeOut;
      }

      // Add voiceover-specific properties
      if (audioType === "voiceover") {
        const voiceoverScript = this.getNodeParameter(
          "voiceoverScript",
          i,
        ) as string;
        if (voiceoverScript) {
          audioElement.voiceoverScript = [
            {
              type: "paragraph",
              children: [{ text: voiceoverScript }],
            },
          ];
        }

        const voiceId = this.getNodeParameter("voiceId", i) as string;
        if (voiceId) {
          audioElement.meta.voiceId = voiceId;
        }

        const language = this.getNodeParameter("language", i) as string;
        if (language) {
          audioElement.meta.language = language;
        }
      }

      // Return just the element object - AttachElement will handle adding to adCode
      returnData.push({
        json: {
          ...inputData,
          element: audioElement,
          success: true,
          meta: {
            lastCreatedElement: {
              id: elementId,
              type: "audio",
              audioType,
              src: finalSrc,
              assetId: finalAssetId,
              isPlaceholder,
            },
            nodeType: "addAudioElement",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return [returnData];
  }
}
