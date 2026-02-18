import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import * as addTesterToGroup from './addTesterToGroup.operation';
import * as createBetaTester from './createBetaTester.operation';
import * as listBetaGroups from './listBetaGroups.operation';
import * as listBetaTesters from './listBetaTesters.operation';
import * as listBuilds from './listBuilds.operation';
import * as removeTesterFromGroup from './removeTesterFromGroup.operation';

export const descriptions: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['testflight'],
			},
		},
		options: [
			{
				name: 'Add Tester to Group',
				value: 'addTesterToGroup',
				description: 'Add an existing beta tester to a beta group',
				action: 'Add tester to group',
			},
			{
				name: 'Create Beta Tester',
				value: 'createBetaTester',
				description: 'Create a new beta tester record (required before adding to a group)',
				action: 'Create beta tester',
			},
			{
				name: 'List Beta Groups',
				value: 'listBetaGroups',
				description: 'List all TestFlight beta groups for an app',
				action: 'List beta groups',
			},
			{
				name: 'List Beta Testers',
				value: 'listBetaTesters',
				description: 'List all testers in a beta group',
				action: 'List beta testers',
			},
			{
				name: 'List Builds',
				value: 'listBuilds',
				description: 'List builds for an app',
				action: 'List builds',
			},
			{
				name: 'Remove Tester From Group',
				value: 'removeTesterFromGroup',
				description: 'Remove a beta tester from a beta group',
				action: 'Remove tester from group',
			},
		],
		default: 'listBetaGroups',
	},
	...listBetaGroups.description,
	...listBetaTesters.description,
	...createBetaTester.description,
	...addTesterToGroup.description,
	...removeTesterFromGroup.description,
	...listBuilds.description,
];

export async function execute(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'listBetaGroups') return listBetaGroups.execute.call(this, index);
	if (operation === 'listBetaTesters') return listBetaTesters.execute.call(this, index);
	if (operation === 'createBetaTester') return createBetaTester.execute.call(this, index);
	if (operation === 'addTesterToGroup') return addTesterToGroup.execute.call(this, index);
	if (operation === 'removeTesterFromGroup') return removeTesterFromGroup.execute.call(this, index);
	if (operation === 'listBuilds') return listBuilds.execute.call(this, index);
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
}
