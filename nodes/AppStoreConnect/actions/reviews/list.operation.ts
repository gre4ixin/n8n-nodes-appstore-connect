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
				resource: ['review'],
				operation: ['list'],
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
				resource: ['review'],
				operation: ['list'],
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
				resource: ['review'],
				operation: ['list'],
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
				resource: ['review'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'Rating',
				name: 'rating',
				type: 'multiOptions',
				options: [
					{ name: '1 Star', value: '1' },
					{ name: '2 Stars', value: '2' },
					{ name: '3 Stars', value: '3' },
					{ name: '4 Stars', value: '4' },
					{ name: '5 Stars', value: '5' },
				],
				default: [],
				description: 'Filter reviews by star rating',
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Most Recent First', value: '-createdDate' },
					{ name: 'Oldest First', value: 'createdDate' },
					{ name: 'Highest Rating First', value: '-rating' },
					{ name: 'Lowest Rating First', value: 'rating' },
				],
				default: '-createdDate',
				description: 'Sort order for reviews',
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
	if (filters.rating && (filters.rating as string[]).length > 0) {
		qs['filter[rating]'] = (filters.rating as string[]).join(',');
	}
	if (filters.sort) qs.sort = filters.sort;

	const returnData: INodeExecutionData[] = [];

	if (returnAll) {
		const reviews = await apiRequestAllItems.call(
			this,
			'GET',
			`/apps/${appId}/customerReviews`,
			qs,
		);
		returnData.push(
			...reviews.map((r) => ({
				json: r as IDataObject,
				pairedItem: { item: index },
			})),
		);
	} else {
		const limit = this.getNodeParameter('limit', index) as number;
		qs.limit = limit;

		const response = await apiRequest.call(
			this,
			'GET',
			`/apps/${appId}/customerReviews`,
			{},
			qs,
		);
		const reviews = (response.data as IDataObject[]) ?? [];
		returnData.push(
			...reviews.map((r) => ({
				json: r as IDataObject,
				pairedItem: { item: index },
			})),
		);
	}

	if (returnData.length === 0) {
		returnData.push({ json: {}, pairedItem: { item: index } });
	}

	return returnData;
}
