import {
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	NodeConnectionType,
	NodePropertyType,
} from 'n8n-workflow';

export class TrilletAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrilletAI',
		name: 'trilletAI',
		icon: 'file:trilletAI.svg',
		group: ['communication'],
		version: 1,
		description: 'Make outbound calls with TrilletAI',
		defaults: {
			name: 'TrilletAI',
		},
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
				type: 'options' as NodePropertyType,
				options: [
					{ name: 'Call', value: 'call' },
				] as INodePropertyOptions[],
				default: 'call',
				noDataExpression: true,
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options' as NodePropertyType,
				displayOptions: {
					show: {
						resource: ['call'],
					},
				},
				options: [
					{ name: 'Outbound Call', value: 'outbound', action: 'Make an outbound call' },
				] as INodePropertyOptions[],
				default: 'outbound',
				noDataExpression: true,
			},
			// Parameters (mirroring your Make mappable params)
			{
				displayName: 'To (Phone Number)',
				name: 'to',
				type: 'string' as NodePropertyType,
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
				type: 'string' as NodePropertyType,
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
				type: 'string' as NodePropertyType,
				required: false,
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
				type: 'json' as NodePropertyType,
				required: false,
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
				type: 'json' as NodePropertyType,
				required: false,
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
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			if (resource === 'call' && operation === 'outbound') {
				// Extract parameters
				const to = this.getNodeParameter('to', i) as string;
				const callAgentId = this.getNodeParameter('call_agent_id', i) as string;
				const callbackUrl = this.getNodeParameter('callback_url', i) as string;
				const dynamicVariables = JSON.parse(this.getNodeParameter('dynamic_variables', i, '[]') as string);
				const metadata = this.getNodeParameter('metadata', i, {}) as IDataObject;

				// Build body (similar to your Make body)
				const body: IDataObject = {
					to,
					call_agent_id: callAgentId,
					callback_url: callbackUrl || undefined,  // Omit if empty
					dynamic_variables: dynamicVariables,
					metadata,
				};

				// Make authenticated POST request
				const options = {
					method: 'POST' as IHttpRequestMethods,
					body,
					headers: {
						'Content-Type': 'application/json',
					},
					uri: 'https://api-trillet.verlatai.com/v1/api/call',
					json: true,
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'trilletApi',
					options,
				);

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