import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest, apiRequestAllItems } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Beta Group ID',
		name: 'betaGroupId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['listBetaTesters'],
			},
		},
		description: 'The unique identifier of the beta group',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['listBetaTesters'],
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
				operation: ['listBetaTesters'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const betaGroupId = this.getNodeParameter('betaGroupId', index) as string;
	const returnAll = this.getNodeParameter('returnAll', index) as boolean;

	const returnData: INodeExecutionData[] = [];

	if (returnAll) {
		const testers = await apiRequestAllItems.call(
			this,
			'GET',
			`/betaGroups/${betaGroupId}/betaTesters`,
		);
		returnData.push(...testers.map((t) => ({ json: t as IDataObject, pairedItem: { item: index } })));
	} else {
		const limit = this.getNodeParameter('limit', index) as number;
		const response = await apiRequest.call(
			this,
			'GET',
			`/betaGroups/${betaGroupId}/betaTesters`,
			{},
			{ limit },
		);
		const testers = (response.data as IDataObject[]) ?? [];
		returnData.push(...testers.map((t) => ({ json: t as IDataObject, pairedItem: { item: index } })));
	}

	if (returnData.length === 0) {
		returnData.push({ json: {}, pairedItem: { item: index } });
	}

	return returnData;
}
