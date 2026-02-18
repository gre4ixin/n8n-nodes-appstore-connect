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
				resource: ['appStoreVersion'],
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
				resource: ['appStoreVersion'],
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
				resource: ['appStoreVersion'],
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
				resource: ['appStoreVersion'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'App Store State',
				name: 'appStoreState',
				type: 'options',
				options: [
					{ name: 'Developer Rejected', value: 'DEVELOPER_REJECTED' },
					{ name: 'In Review', value: 'IN_REVIEW' },
					{ name: 'Pending Apple Release', value: 'PENDING_APPLE_RELEASE' },
					{ name: 'Pending Developer Release', value: 'PENDING_DEVELOPER_RELEASE' },
					{ name: 'Prepare for Submission', value: 'PREPARE_FOR_SUBMISSION' },
					{ name: 'Ready for Sale', value: 'READY_FOR_SALE' },
					{ name: 'Rejected', value: 'REJECTED' },
					{ name: 'Waiting for Review', value: 'WAITING_FOR_REVIEW' },
				],
				default: 'READY_FOR_SALE',
				description: 'Filter by App Store submission state',
			},
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
				description: 'Filter by platform',
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
	if (filters.appStoreState) qs['filter[appStoreState]'] = filters.appStoreState;

	const returnData: INodeExecutionData[] = [];

	if (returnAll) {
		const versions = await apiRequestAllItems.call(
			this,
			'GET',
			`/apps/${appId}/appStoreVersions`,
			qs,
		);
		returnData.push(
			...versions.map((v) => ({
				json: v as IDataObject,
				pairedItem: { item: index },
			})),
		);
	} else {
		const limit = this.getNodeParameter('limit', index) as number;
		qs.limit = limit;

		const response = await apiRequest.call(
			this,
			'GET',
			`/apps/${appId}/appStoreVersions`,
			{},
			qs,
		);
		const versions = (response.data as IDataObject[]) ?? [];
		returnData.push(
			...versions.map((v) => ({
				json: v as IDataObject,
				pairedItem: { item: index },
			})),
		);
	}

	if (returnData.length === 0) {
		returnData.push({ json: {}, pairedItem: { item: index } });
	}

	return returnData;
}
