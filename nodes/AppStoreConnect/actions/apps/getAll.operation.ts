import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { apiRequest, apiRequestAllItems } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
			maxValue: 200,
		},
		displayOptions: {
			show: {
				resource: ['app'],
				operation: ['getAll'],
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
				resource: ['app'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Bundle ID',
				name: 'bundleId',
				type: 'string',
				default: '',
				placeholder: 'com.example.myapp',
				description: 'Filter apps by bundle identifier',
			},
			{
				displayName: 'App Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter apps by name (case-sensitive contains search)',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', index) as boolean;
	const filters = this.getNodeParameter('filters', index, {}) as IDataObject;

	const qs: IDataObject = {};
	if (filters.bundleId) qs['filter[bundleId]'] = filters.bundleId;
	if (filters.name) qs['filter[name]'] = filters.name;

	const returnData: INodeExecutionData[] = [];

	if (returnAll) {
		const apps = await apiRequestAllItems.call(this, 'GET', '/apps', qs);
		returnData.push(
			...apps.map((app) => ({
				json: app as IDataObject,
				pairedItem: { item: index },
			})),
		);
	} else {
		const limit = this.getNodeParameter('limit', index) as number;
		qs.limit = limit;

		const response = await apiRequest.call(this, 'GET', '/apps', {}, qs);
		const apps = (response.data as IDataObject[]) ?? [];
		returnData.push(
			...apps.map((app) => ({
				json: app as IDataObject,
				pairedItem: { item: index },
			})),
		);
	}

	if (returnData.length === 0) {
		returnData.push({
			json: {},
			pairedItem: { item: index },
		});
	}

	return returnData;
}
