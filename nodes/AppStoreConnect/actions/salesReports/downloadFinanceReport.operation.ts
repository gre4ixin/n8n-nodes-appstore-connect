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
				operation: ['downloadFinanceReport'],
			},
		},
		description:
			'Your vendor number from App Store Connect. Found under Payments and Financial Reports.',
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
				operation: ['downloadFinanceReport'],
			},
		},
		placeholder: 'YYYY-MM',
		description: 'The fiscal month of the report in YYYY-MM format (e.g. 2025-01)',
	},
	{
		displayName: 'Region Code',
		name: 'regionCode',
		type: 'options',
		options: [
			{ name: 'Australia', value: 'AUS' },
			{ name: 'Canada', value: 'CAN' },
			{ name: 'China', value: 'CHN' },
			{ name: 'Europe', value: 'EUR' },
			{ name: 'Japan', value: 'JPY' },
			{ name: 'Rest of World', value: 'WW' },
			{ name: 'United Kingdom', value: 'GBR' },
			{ name: 'United States', value: 'US' },
			{ name: 'Worldwide (All Regions)', value: 'ZZ' },
		],
		default: 'ZZ',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadFinanceReport'],
			},
		},
		description: 'The region for the finance report. Use "Worldwide" for consolidated earnings.',
	},
	{
		displayName: 'Report Type',
		name: 'reportType',
		type: 'options',
		options: [
			{ name: 'Finance Detail', value: 'FINANCE_DETAIL' },
			{ name: 'Financial Report', value: 'FINANCIAL' },
		],
		default: 'FINANCIAL',
		required: true,
		displayOptions: {
			show: {
				resource: ['salesReport'],
				operation: ['downloadFinanceReport'],
			},
		},
		description: 'The type of finance report',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const vendorNumber = this.getNodeParameter('vendorNumber', index) as string;
	const reportDate = this.getNodeParameter('reportDate', index) as string;
	const regionCode = this.getNodeParameter('regionCode', index) as string;
	const reportType = this.getNodeParameter('reportType', index) as string;

	// Validate YYYY-MM format
	if (!/^\d{4}-\d{2}$/.test(reportDate)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid date format for Finance Report. Expected YYYY-MM (e.g. 2025-01), got: ${reportDate}`,
			{ itemIndex: index },
		);
	}

	const qs: IDataObject = {
		'filter[reportType]': reportType,
		'filter[reportDate]': reportDate,
		'filter[regionCode]': regionCode,
		'filter[vendorNumber]': vendorNumber,
	};

	const buffer = await apiRequestReport.call(this, '/financeReports', qs);

	if (buffer === null) {
		return [
			{
				json: {
					available: false,
					message: `Finance report not yet available for ${reportDate} (${regionCode}). Finance reports are typically available on the 15th of the following month.`,
					reportType,
					reportDate,
					regionCode,
					vendorNumber,
				},
				pairedItem: { item: index },
			},
		];
	}

	const filename = `finance_${reportType.toLowerCase()}_${regionCode}_${reportDate}.tsv`;
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
				reportDate,
				regionCode,
				vendorNumber,
				filename,
			},
			binary: { data: binaryData },
			pairedItem: { item: index },
		},
	];
}
