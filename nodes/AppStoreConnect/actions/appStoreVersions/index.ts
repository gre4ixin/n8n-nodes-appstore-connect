import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import * as get from './get.operation';
import * as list from './list.operation';

export const descriptions: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['appStoreVersion'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a specific App Store version by its ID',
				action: 'Get an app store version',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all versions for an app',
				action: 'List app store versions',
			},
		],
		default: 'list',
	},
	...get.description,
	...list.description,
];

export async function execute(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'get') {
		return get.execute.call(this, index);
	}
	if (operation === 'list') {
		return list.execute.call(this, index);
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
}
