import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Response ID',
		name: 'responseId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['deleteResponse'],
			},
		},
		description:
			'The unique identifier of the review response to delete. Use "Get Response" to retrieve it.',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const responseId = this.getNodeParameter('responseId', index) as string;

	await apiRequest.call(this, 'DELETE', `/customerReviewResponses/${responseId}`);

	return [
		{
			json: { success: true, deletedId: responseId },
			pairedItem: { item: index },
		},
	];
}
