import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import * as get from './get.operation';
import * as getAll from './getAll.operation';

export const descriptions: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['app'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a specific app by its ID',
				action: 'Get an app',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of many apps in your team',
				action: 'Get many apps',
			},
		],
		default: 'getAll',
	},
	...get.description,
	...getAll.description,
];

export async function execute(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'get') {
		return get.execute.call(this, index);
	}
	if (operation === 'getAll') {
		return getAll.execute.call(this, index);
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
}
