import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class CreativeSuiteApi implements ICredentialType {
  name = 'creativeSuiteApi';

  displayName = 'Creative Suite API';

  documentationUrl = 'https://docs.creativesuite.com/api';

  properties: INodeProperties[] = [
    {
      displayName: 'API URL',
      name: 'apiUrl',
      type: 'string',
      default: 'https://api.creativesuite.com',
      required: true,
      description: 'The base URL for the Creative Suite API',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Creative Suite API key',
    },
    {
      displayName: 'Workspace ID',
      name: 'workspaceId',
      type: 'number',
      default: 0,
      required: true,
      description: 'Your Creative Suite workspace ID',
    },
    {
      displayName: 'User ID',
      name: 'userId',
      type: 'number',
      default: 0,
      required: true,
      description: 'Your Creative Suite user ID',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiUrl}}',
      url: '/trpc/auth.test',
      method: 'GET',
    },
  };
}
