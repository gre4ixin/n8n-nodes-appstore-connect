import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Review ID',
		name: 'reviewId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['getResponse'],
			},
		},
		description: 'The unique identifier of the customer review',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const reviewId = this.getNodeParameter('reviewId', index) as string;

	try {
		const response = await apiRequest.call(
			this,
			'GET',
			`/customerReviews/${reviewId}/response`,
		);
		return [
			{
				json: (response.data as IDataObject) ?? {},
				pairedItem: { item: index },
			},
		];
	} catch (error) {
		// 404 = no response exists yet — this is a normal state, not an error
		if ((error as { httpCode?: string }).httpCode === '404' || (error as Error).message?.includes('not found')) {
			return [
				{
					json: { hasResponse: false, reviewId },
					pairedItem: { item: index },
				},
			];
		}
		throw error;
	}
}
