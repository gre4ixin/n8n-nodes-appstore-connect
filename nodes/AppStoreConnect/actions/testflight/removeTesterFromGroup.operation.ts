import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

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
				operation: ['removeTesterFromGroup'],
			},
		},
		description: 'The unique identifier of the beta group',
	},
	{
		displayName: 'Tester ID',
		name: 'testerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['removeTesterFromGroup'],
			},
		},
		description: 'The unique identifier of the beta tester to remove from the group',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const betaGroupId = this.getNodeParameter('betaGroupId', index) as string;
	const testerId = this.getNodeParameter('testerId', index) as string;

	const body: IDataObject = {
		data: [{ type: 'betaTesters', id: testerId }],
	};

	await apiRequest.call(
		this,
		'DELETE',
		`/betaGroups/${betaGroupId}/relationships/betaTesters`,
		body,
	);

	return [
		{
			json: { success: true, betaGroupId, testerId },
			pairedItem: { item: index },
		},
	];
}
