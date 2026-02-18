import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'App ID',
		name: 'appId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['get'],
			},
		},
		description: 'The unique numeric identifier of the app (e.g. 1234567890)',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const appId = this.getNodeParameter('appId', index) as string;

	const response = await apiRequest.call(this, 'GET', `/apps/${appId}`);

	return [
		{
			json: (response.data as IDataObject) ?? {},
			pairedItem: { item: index },
		},
	];
}
