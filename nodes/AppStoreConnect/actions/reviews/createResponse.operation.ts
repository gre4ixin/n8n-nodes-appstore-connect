import { NodeOperationError } from 'n8n-workflow';
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
				operation: ['createResponse'],
			},
		},
		description: 'The unique identifier of the customer review to respond to',
	},
	{
		displayName: 'Response Body',
		name: 'responseBody',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['createResponse'],
			},
		},
		description:
			'Your response to the customer review. Note: responses may take up to 24 hours to appear publicly on the App Store.',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const reviewId = this.getNodeParameter('reviewId', index) as string;
	const responseBody = this.getNodeParameter('responseBody', index) as string;

	const body: IDataObject = {
		data: {
			type: 'customerReviewResponses',
			attributes: {
				responseBody,
			},
			relationships: {
				review: {
					data: { type: 'customerReviews', id: reviewId },
				},
			},
		},
	};

	try {
		const response = await apiRequest.call(this, 'POST', '/customerReviewResponses', body);
		return [
			{
				json: (response.data as IDataObject) ?? {},
				pairedItem: { item: index },
			},
		];
	} catch (error) {
		const err = error as { httpCode?: string; message?: string };
		if (err.httpCode === '409') {
			throw new NodeOperationError(
				this.getNode(),
				'A response already exists for this review. Use the "Update Response" operation to modify the existing response.',
				{ itemIndex: index },
			);
		}
		throw error;
	}
}
