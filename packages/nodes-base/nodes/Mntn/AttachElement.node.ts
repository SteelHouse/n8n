import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class AttachElement implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Attach Element",
    name: "attachElement",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle:
      '={{$parameter["layerType"]}} {{$parameter["layerType"] === "scene" ? "(" + $parameter["sceneIndex"] + ")" : ""}}',
    description:
      "Attach an element (from Add*Element nodes) to AdCode layers using Redis - handles ALL adCode operations",
    defaults: {
      name: "Attach Element",
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
        displayName: "Layer Type",
        name: "layerType",
        type: "options",
        options: [
          {
            name: "Scene",
            value: "scene",
          },
          {
            name: "Overlay",
            value: "overlay",
          },
          {
            name: "Underlay",
            value: "underlay",
          },
        ],
        default: "scene",
        description: "Which layer to attach the element to",
        required: true,
      },
      {
        displayName: "Scene Index",
        name: "sceneIndex",
        type: "number",
        displayOptions: {
          show: {
            layerType: ["scene"],
          },
        },
        default: 0,
        description: "Index of the scene to attach the element to (0-based)",
        required: false,
      },
      {
        displayName: "Element Data Path",
        name: "elementDataPath",
        type: "string",
        default: "element",
        description:
          "JSON path to the element data in the input (e.g., 'element', 'data.element')",
        required: true,
      },
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
      const layerType = this.getNodeParameter("layerType", i) as string;
      const sceneIndex =
        layerType === "scene"
          ? (this.getNodeParameter("sceneIndex", i) as number)
          : 0;
      const elementDataPath = this.getNodeParameter(
        "elementDataPath",
        i,
      ) as string;

      // Extract element from input data using the specified path
      let element: any;
      if (elementDataPath.includes(".")) {
        // Handle nested paths like 'data.element'
        const pathParts = elementDataPath.split(".");
        element = pathParts.reduce(
          (obj: any, key: string) => obj?.[key],
          inputData,
        );
      } else {
        // Handle simple paths like 'element'
        element = inputData[elementDataPath];
      }

      if (!element) {
        throw new Error(
          `Element not found at path '${elementDataPath}' in input data`,
        );
      }

      // REDIS APPROACH: Get current adCode from Redis
      const executionIdParam = this.getNodeParameter(
        "executionId",
        i,
      ) as string;
      const executionId = executionIdParam || this.getExecutionId();
      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

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
        `[AttachElement] Retrieved adCode from Redis for execution ${executionId}`,
      );

      // Update element with layer information
      if (element.meta) {
        element.meta.layerType = layerType;
        if (layerType === "scene") {
          element.meta.sceneIndex = sceneIndex;
        }
      } else {
        element.meta = {
          layerType,
          ...(layerType === "scene" ? { sceneIndex } : {}),
        };
      }

      // Add element to appropriate layer
      if (layerType === "overlay") {
        if (!adCode.overlay) {
          adCode.overlay = { elements: [] };
        }
        if (!adCode.overlay.elements) {
          adCode.overlay.elements = [];
        }
        adCode.overlay.elements.push(element);
      } else if (layerType === "underlay") {
        if (!adCode.underlay) {
          adCode.underlay = { elements: [] };
        }
        if (!adCode.underlay.elements) {
          adCode.underlay.elements = [];
        }
        adCode.underlay.elements.push(element);
      } else if (layerType === "scene") {
        // Ensure scenes structure exists
        if (!adCode.scenes) {
          adCode.scenes = { scenes: [] };
        }
        if (!adCode.scenes.scenes) {
          adCode.scenes.scenes = [];
        }

        // Ensure scene exists at the specified index - fill gaps if needed
        while (adCode.scenes.scenes.length <= sceneIndex) {
          adCode.scenes.scenes.push(null); // Fill gaps with null temporarily
        }

        // Create the scene at the specific index if it doesn't exist
        if (!adCode.scenes.scenes[sceneIndex]) {
          adCode.scenes.scenes[sceneIndex] = {
            id: `scene-${sceneIndex}`,
            type: "scene" as const,
            elements: [],
            sequenceProps: {
              durationInFrames: 900, // Default duration, can be overridden later
            },
            transition: {
              action: "instant" as const,
            },
            meta: {},
          };
        }

        // Ensure elements array exists
        if (!adCode.scenes.scenes[sceneIndex].elements) {
          adCode.scenes.scenes[sceneIndex].elements = [];
        }

        // Add element to scene
        adCode.scenes.scenes[sceneIndex].elements.push(element);
      } else {
        throw new Error(`Invalid layer type: ${layerType}`);
      }

      // Store updated adCode back to Redis
      await axios.post(
        `${apiUrl}/trpc/n8n.storeExecutionAdCode`,
        { executionId, adCode },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
        },
      );

      console.log(
        `[AttachElement] Updated adCode in Redis for execution ${executionId}`,
      );

      // Return data with success status
      returnData.push({
        json: {
          ...inputData,
          success: true,
          executionId,
          elementAttached: {
            id: element.id,
            type: element.type,
            layerType,
            sceneIndex: layerType === "scene" ? sceneIndex : undefined,
          },
          meta: {
            nodeType: "attachElement",
            timestamp: new Date().toISOString(),
            redisStorage: true,
          },
        },
        binary: items[i].binary,
      });
    }

    return [returnData];
  }
}
