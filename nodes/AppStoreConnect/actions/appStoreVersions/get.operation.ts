import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Version ID',
		name: 'versionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['appStoreVersion'],
				operation: ['get'],
			},
		},
		description: 'The unique identifier of the App Store version',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const versionId = this.getNodeParameter('versionId', index) as string;

	const response = await apiRequest.call(this, 'GET', `/appStoreVersions/${versionId}`);

	return [
		{
			json: (response.data as IDataObject) ?? {},
			pairedItem: { item: index },
		},
	];
}
