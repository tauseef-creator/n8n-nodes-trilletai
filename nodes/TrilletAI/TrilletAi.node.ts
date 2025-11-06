import type {
	IDataObject,
	INodeExecutionData,
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';

export class TrilletAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrilletAI',
		name: 'trilletAi',
		icon: { light: 'file:../../icons/trilletAI.svg', dark: 'file:../../icons/trilletAI.dark.svg' },
		group: ['input'],
		version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Make outbound calls with TrilletAI',
		defaults: {
			name: 'TrilletAI',
		},
        usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'trilletApi',
				required: true,
			},
		],
		properties: [
			// Resource and operation (fixed for simplicity)
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'Call', value: 'call' },
				],
				default: 'call',
				noDataExpression: true,
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['call'],
					},
				},
				options: [
					{ name: 'Outbound Call', value: 'outbound', action: 'Make an outbound call' },
				],
				default: 'outbound',
				noDataExpression: true,
			},
			// Parameters (mirroring your Make mappable params)
			{
				displayName: 'To (Phone Number)',
				name: 'to',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['outbound'],
						resource: ['call'],
					},
				},
				default: '',
				placeholder: '+1234567890',
				description: 'The phone number to call',
			},
			{
				displayName: 'Call Agent ID',
				name: 'call_agent_id',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['outbound'],
						resource: ['call'],
					},
				},
				default: '',
				description: 'The ID of the call agent',
			},
			{
				displayName: 'Callback URL',
				name: 'callback_url',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['outbound'],
						resource: ['call'],
					},
				},
				default: '',
				description: 'Optional URL for call callbacks',
			},
			{
				displayName: 'Dynamic Variables',
				name: 'dynamic_variables',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['outbound'],
						resource: ['call'],
					},
				},
				default: '[{"name": "key", "value": "value"}]',
				description: 'Array of {name, value} objects as JSON',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['outbound'],
						resource: ['call'],
					},
				},
				default: '{}',
				description: 'Optional metadata as JSON',
			},
		],
	};

		async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i);
			const operation = this.getNodeParameter('operation', i);

			if (resource === 'call' && operation === 'outbound') {
				// Extract parameters
				const to = this.getNodeParameter('to', i) as string;
				const callAgentId = this.getNodeParameter('call_agent_id', i) as string;
				const callbackUrl = this.getNodeParameter('callback_url', i) as string;
				const dynamicVariablesRaw = this.getNodeParameter('dynamic_variables', i, '[]') as string;
				const metadataRaw = this.getNodeParameter('metadata', i, '{}') as string;

				// Parse and validate dynamic_variables
				let dynamicVariables;
				try {
					dynamicVariables = JSON.parse(dynamicVariablesRaw);
					// Ensure it's an array and not empty
					if (!Array.isArray(dynamicVariables) || dynamicVariables.length === 0) {
						dynamicVariables = undefined;
					}
				} catch {
					dynamicVariables = undefined;
				}

				// Parse and validate metadata
				let metadata;
				try {
					metadata = JSON.parse(metadataRaw);
					// Ensure it's an object and not empty
					if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata) || Object.keys(metadata).length === 0) {
						metadata = undefined;
					}
				} catch {
					metadata = undefined;
				}

				// Build body (only include fields with valid values)
				const body: IDataObject = {
					to,
					call_agent_id: callAgentId,
					...(callbackUrl && { callback_url: callbackUrl }),  // Only include if not empty
					...(dynamicVariables && { dynamic_variables: dynamicVariables }),  // Only include if valid and not empty
					...(metadata && { metadata }),  // Only include if valid and not empty
				};

				// Make authenticated POST request
				const options: IHttpRequestOptions = {
					method: 'POST',
					body,
					url: 'https://api-trillet.verlatai.com/v1/api/call',
					json: true,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'trilletApi',
					options,
				) as IDataObject;

				// Map response to outputs (matching your Make response)
				const newItem: INodeExecutionData = {
					json: {
						status: response.status || 'success',
						call_id: response.call_id,
						message: response.message || 'Call initiated successfully',
						// Add full response if needed: ...response
					},
				};
				returnData.push(newItem);
			}
		}

		return [returnData];
	}
}