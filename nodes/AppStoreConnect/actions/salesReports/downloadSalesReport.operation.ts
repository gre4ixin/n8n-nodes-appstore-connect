import { NodeOperationError } from 'n8n-workflow';
import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequestReport } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Vendor Number',
		name: 'vendorNumber',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadSalesReport'],
			},
		},
		description:
			'Your vendor number from App Store Connect. Found under Payments and Financial Reports.',
	},
	{
		displayName: 'Report Type',
		name: 'reportType',
		type: 'options',
		options: [
			{
				name: 'Pre-Order',
				value: 'PRE_ORDER',
				description: 'Pre-order data',
			},
			{
				name: 'Sales',
				value: 'SALES',
				description: 'App and in-app purchase sales data',
			},
			{
				name: 'Subscriber',
				value: 'SUBSCRIBER',
				description: 'Subscriber-level subscription data',
			},
			{
				name: 'Subscription',
				value: 'SUBSCRIPTION',
				description: 'Subscription product-level data',
			},
			{
				name: 'Subscription Event',
				value: 'SUBSCRIPTION_EVENT',
				description: 'Subscription lifecycle events (upgrades, downgrades, renewals)',
			},
		],
		default: 'SALES',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadSalesReport'],
			},
		},
		description: 'The type of report to download',
	},
	{
		displayName: 'Report Subtype',
		name: 'reportSubType',
		type: 'options',
		options: [
			{ name: 'Detailed', value: 'DETAILED' },
			{ name: 'Summary', value: 'SUMMARY' },
		],
		default: 'SUMMARY',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadSalesReport'],
			},
		},
		description: 'The level of detail in the report',
	},
	{
		displayName: 'Frequency',
		name: 'frequency',
		type: 'options',
		options: [
			{ name: 'Daily', value: 'DAILY' },
			{ name: 'Monthly', value: 'MONTHLY' },
			{ name: 'Weekly', value: 'WEEKLY' },
			{ name: 'Yearly', value: 'YEARLY' },
		],
		default: 'DAILY',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadSalesReport'],
			},
		},
		description: 'The reporting frequency',
	},
	{
		displayName: 'Report Date',
		name: 'reportDate',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadSalesReport'],
			},
		},
		placeholder: 'YYYY-MM-DD',
		description:
			'The date of the report. Format: YYYY-MM-DD for DAILY/WEEKLY, YYYY-MM for MONTHLY, YYYY for YEARLY. Daily reports are typically available within 24 hours after the end of the day.',
	},
];

const DATE_FORMATS: Record<string, RegExp> = {
	DAILY: /^\d{4}-\d{2}-\d{2}$/,
	WEEKLY: /^\d{4}-\d{2}-\d{2}$/,
	MONTHLY: /^\d{4}-\d{2}$/,
	YEARLY: /^\d{4}$/,
};

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const vendorNumber = this.getNodeParameter('vendorNumber', index) as string;
	const reportType = this.getNodeParameter('reportType', index) as string;
	const reportSubType = this.getNodeParameter('reportSubType', index) as string;
	const frequency = this.getNodeParameter('frequency', index) as string;
	const reportDate = this.getNodeParameter('reportDate', index) as string;

	// Client-side date format validation
	const expectedFormat = DATE_FORMATS[frequency];
	if (expectedFormat && !expectedFormat.test(reportDate)) {
		const examples: Record<string, string> = {
			DAILY: 'YYYY-MM-DD (e.g. 2025-01-15)',
			WEEKLY: 'YYYY-MM-DD (e.g. 2025-01-13 — use the Monday of the desired week)',
			MONTHLY: 'YYYY-MM (e.g. 2025-01)',
			YEARLY: 'YYYY (e.g. 2025)',
		};
		throw new NodeOperationError(
			this.getNode(),
			`Invalid date format for ${frequency} frequency. Expected format: ${examples[frequency] ?? 'unknown'}`,
			{ itemIndex: index },
		);
	}

	const qs: IDataObject = {
		'filter[reportType]': reportType,
		'filter[reportSubType]': reportSubType,
		'filter[frequency]': frequency,
		'filter[reportDate]': reportDate,
		'filter[vendorNumber]': vendorNumber,
	};

	const buffer = await apiRequestReport.call(this, '/salesReports', qs);

	if (buffer === null) {
		// Report not yet generated — normal for recent dates
		return [
			{
				json: {
					available: false,
					message: `Sales report not yet available for ${frequency.toLowerCase()} date ${reportDate}. Reports are typically available within 24 hours after the reporting period ends.`,
					reportType,
					reportSubType,
					frequency,
					reportDate,
					vendorNumber,
				},
				pairedItem: { item: index },
			},
		];
	}

	const filename = `sales_${reportType.toLowerCase()}_${reportSubType.toLowerCase()}_${frequency.toLowerCase()}_${reportDate}.tsv`;
	const binaryData = await this.helpers.prepareBinaryData(
		buffer,
		filename,
		'text/tab-separated-values',
	);

	return [
		{
			json: {
				available: true,
				reportType,
				reportSubType,
				frequency,
				reportDate,
				vendorNumber,
				filename,
			},
			binary: { data: binaryData },
			pairedItem: { item: index },
		},
	];
}
