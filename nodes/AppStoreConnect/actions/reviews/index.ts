import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import * as createResponse from './createResponse.operation';
import * as deleteResponse from './deleteResponse.operation';
import * as getResponse from './getResponse.operation';
import * as list from './list.operation';
import * as updateResponse from './updateResponse.operation';

export const descriptions: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['review'],
			},
		},
		options: [
			{
				name: 'Create Response',
				value: 'createResponse',
				description: 'Create a developer response to a customer review',
				action: 'Create review response',
			},
			{
				name: 'Delete Response',
				value: 'deleteResponse',
				description: 'Delete a developer response to a review',
				action: 'Delete review response',
			},
			{
				name: 'Get Response',
				value: 'getResponse',
				description: 'Get the developer response to a review (returns empty if no response yet)',
				action: 'Get review response',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List customer reviews for an app',
				action: 'List customer reviews',
			},
			{
				name: 'Update Response',
				value: 'updateResponse',
				description: 'Update an existing developer response',
				action: 'Update review response',
			},
		],
		default: 'list',
	},
	...list.description,
	...getResponse.description,
	...createResponse.description,
	...updateResponse.description,
	...deleteResponse.description,
];

export async function execute(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'list') return list.execute.call(this, index);
	if (operation === 'getResponse') return getResponse.execute.call(this, index);
	if (operation === 'createResponse') return createResponse.execute.call(this, index);
	if (operation === 'updateResponse') return updateResponse.execute.call(this, index);
	if (operation === 'deleteResponse') return deleteResponse.execute.call(this, index);
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
}
