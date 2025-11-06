import type {
	IAuthenticateGeneric,
    Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TrilletApi implements ICredentialType {
	name = 'trilletApi';

	displayName = 'TrilletAI API';

    icon: Icon = { light: 'file:../icons/trilletAI.svg', dark: 'file:../icons/trilletAI.dark.svg' };

    documentationUrl =
		'https://docs.trillet.ai/documentation/introduction';
        
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Workspace ID',
			name: 'workspaceId',
			type: 'string',
			default: '',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{ $credentials.apiKey }}',
				'x-workspace-id': '={{ $credentials.workspaceId }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api-trillet.verlatai.com/v1',
			url: '/api/',
			method: 'GET',
		},
	};
}