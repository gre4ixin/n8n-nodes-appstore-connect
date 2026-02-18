import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest, apiRequestAllItems } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'App ID',
		name: 'appId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['listBuilds'],
			},
		},
		description: 'The unique numeric identifier of the app',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['listBuilds'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 200 },
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['listBuilds'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['listBuilds'],
			},
		},
		options: [
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				options: [
					{ name: 'iOS', value: 'IOS' },
					{ name: 'macOS', value: 'MAC_OS' },
					{ name: 'tvOS', value: 'TV_OS' },
				],
				default: 'IOS',
				description: 'Filter builds by platform',
			},
			{
				displayName: 'Processing State',
				name: 'processingState',
				type: 'options',
				options: [
					{ name: 'Valid', value: 'VALID' },
					{ name: 'Processing', value: 'PROCESSING' },
					{ name: 'Failed', value: 'FAILED' },
					{ name: 'Invalid', value: 'INVALID' },
				],
				default: 'VALID',
				description:
					'Filter builds by processing state. Use "Valid" to find builds ready for distribution.',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const appId = this.getNodeParameter('appId', index) as string;
	const returnAll = this.getNodeParameter('returnAll', index) as boolean;
	const filters = this.getNodeParameter('filters', index, {}) as IDataObject;

	const qs: IDataObject = {};
	if (filters.platform) qs['filter[platform]'] = filters.platform;
	if (filters.processingState) qs['filter[processingState]'] = filters.processingState;

	const returnData: INodeExecutionData[] = [];

	if (returnAll) {
		const builds = await apiRequestAllItems.call(this, 'GET', `/apps/${appId}/builds`, qs);
		returnData.push(...builds.map((b) => ({ json: b as IDataObject, pairedItem: { item: index } })));
	} else {
		const limit = this.getNodeParameter('limit', index) as number;
		qs.limit = limit;
		const response = await apiRequest.call(this, 'GET', `/apps/${appId}/builds`, {}, qs);
		const builds = (response.data as IDataObject[]) ?? [];
		returnData.push(...builds.map((b) => ({ json: b as IDataObject, pairedItem: { item: index } })));
	}

	if (returnData.length === 0) {
		returnData.push({ json: {}, pairedItem: { item: index } });
	}

	return returnData;
}
