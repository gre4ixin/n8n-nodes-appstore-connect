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
				operation: ['listBetaGroups'],
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
				operation: ['listBetaGroups'],
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
				operation: ['listBetaGroups'],
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
				operation: ['listBetaGroups'],
			},
		},
		options: [
			{
				displayName: 'Group Type',
				name: 'isInternal',
				type: 'options',
				options: [
					{ name: 'All Groups', value: '' },
					{ name: 'Internal Only', value: 'true' },
					{ name: 'External Only', value: 'false' },
				],
				default: '',
				description: 'Filter by internal or external beta group',
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
	if (filters.isInternal !== '' && filters.isInternal !== undefined) {
		qs['filter[isInternal]'] = filters.isInternal;
	}

	const returnData: INodeExecutionData[] = [];

	if (returnAll) {
		const groups = await apiRequestAllItems.call(
			this,
			'GET',
			`/apps/${appId}/betaGroups`,
			qs,
		);
		returnData.push(...groups.map((g) => ({ json: g as IDataObject, pairedItem: { item: index } })));
	} else {
		const limit = this.getNodeParameter('limit', index) as number;
		qs.limit = limit;
		const response = await apiRequest.call(this, 'GET', `/apps/${appId}/betaGroups`, {}, qs);
		const groups = (response.data as IDataObject[]) ?? [];
		returnData.push(...groups.map((g) => ({ json: g as IDataObject, pairedItem: { item: index } })));
	}

	if (returnData.length === 0) {
		returnData.push({ json: {}, pairedItem: { item: index } });
	}

	return returnData;
}
