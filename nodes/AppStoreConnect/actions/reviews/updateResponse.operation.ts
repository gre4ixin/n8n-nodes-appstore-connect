import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
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
				operation: ['updateResponse'],
			},
		},
		description:
			'The unique identifier of the review response to update. Use "Get Response" to retrieve it.',
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
				operation: ['updateResponse'],
			},
		},
		description:
			'The updated response text. Note: changes may take up to 24 hours to appear publicly on the App Store.',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const responseId = this.getNodeParameter('responseId', index) as string;
	const responseBody = this.getNodeParameter('responseBody', index) as string;

	const body: IDataObject = {
		data: {
			type: 'customerReviewResponses',
			id: responseId,
			attributes: {
				responseBody,
			},
		},
	};

	const response = await apiRequest.call(
		this,
		'PATCH',
		`/customerReviewResponses/${responseId}`,
		body,
	);

	return [
		{
			json: (response.data as IDataObject) ?? {},
			pairedItem: { item: index },
		},
	];
}
