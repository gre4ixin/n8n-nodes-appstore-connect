import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['createBetaTester'],
			},
		},
		description: 'The email address of the beta tester',
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['createBetaTester'],
			},
		},
		description: 'The first name of the beta tester',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['createBetaTester'],
			},
		},
		description: 'The last name of the beta tester',
	},
	{
		displayName: 'Beta Group ID',
		name: 'betaGroupId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['testflight'],
				operation: ['createBetaTester'],
			},
		},
		description:
			'Optional: add the tester directly to a beta group. Use "List Beta Groups" to get the group ID.',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const email = this.getNodeParameter('email', index) as string;
	const firstName = this.getNodeParameter('firstName', index, '') as string;
	const lastName = this.getNodeParameter('lastName', index, '') as string;
	const betaGroupId = this.getNodeParameter('betaGroupId', index, '') as string;

	const attributes: IDataObject = { email };
	if (firstName) attributes.firstName = firstName;
	if (lastName) attributes.lastName = lastName;

	const body: IDataObject = {
		data: {
			type: 'betaTesters',
			attributes,
			...(betaGroupId
				? {
						relationships: {
							betaGroups: {
								data: [{ type: 'betaGroups', id: betaGroupId }],
							},
						},
					}
				: {}),
		},
	};

	const response = await apiRequest.call(this, 'POST', '/betaTesters', body);

	return [
		{
			json: (response.data as IDataObject) ?? {},
			pairedItem: { item: index },
		},
	];
}
