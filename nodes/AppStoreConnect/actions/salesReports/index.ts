import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import * as downloadFinanceReport from './downloadFinanceReport.operation';
import * as downloadSalesReport from './downloadSalesReport.operation';

export const descriptions: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
			},
		},
		options: [
			{
				name: 'Download Sales Report',
				value: 'downloadSalesReport',
				description:
					'Download a sales and trends report (TSV format). Returns binary data that can be read with a Code node.',
				action: 'Download sales report',
			},
			{
				name: 'Download Finance Report',
				value: 'downloadFinanceReport',
				description:
					'Download a finance report with earnings by region (TSV format). Returns binary data.',
				action: 'Download finance report',
			},
		],
		default: 'downloadSalesReport',
	},
	...downloadSalesReport.description,
	...downloadFinanceReport.description,
];

export async function execute(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'downloadSalesReport') return downloadSalesReport.execute.call(this, index);
	if (operation === 'downloadFinanceReport') return downloadFinanceReport.execute.call(this, index);
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
}
