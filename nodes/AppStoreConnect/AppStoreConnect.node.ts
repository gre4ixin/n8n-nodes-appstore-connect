import * as jwt from 'jsonwebtoken';
import { NodeOperationError } from 'n8n-workflow';
import type {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import * as appStoreVersions from './actions/appStoreVersions';
import * as apps from './actions/apps';
import * as reviews from './actions/reviews';
import * as salesReports from './actions/salesReports';
import * as testflight from './actions/testflight';

const TOKEN_MAX_AGE_SECONDS = 1200;

export class AppStoreConnect implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'App Store Connect',
		name: 'appStoreConnect',
		icon: 'file:appstoreconnect.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Interact with the Apple App Store Connect API — manage apps, TestFlight, reviews, and sales reports',
		defaults: {
			name: 'App Store Connect',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'appStoreConnectApi',
				required: true,
				testedBy: 'testAppStoreConnectApi',
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'App',
						value: 'app',
						description: 'List and retrieve apps in your team',
					},
					{
						name: 'App Store Version',
						value: 'appStoreVersion',
						description: 'List and retrieve App Store versions for an app',
					},
					{
						name: 'Customer Review',
						value: 'review',
						description: 'List reviews and manage developer responses',
					},
					{
						name: 'Sales Report',
						value: 'salesReport',
						description: 'Download sales and finance reports',
					},
					{
						name: 'TestFlight',
						value: 'testflight',
						description: 'Manage beta groups, testers, and builds',
					},
				],
				default: 'app',
			},
			...apps.descriptions,
			...appStoreVersions.descriptions,
			...reviews.descriptions,
			...testflight.descriptions,
			...salesReports.descriptions,
		],
	};

	methods = {
		credentialTest: {
			async testAppStoreConnectApi(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const { issuerId, keyId, privateKey } = credential.data as {
					issuerId: string;
					keyId: string;
					privateKey: string;
				};

				if (!issuerId || !keyId || !privateKey) {
					return {
						status: 'Error',
						message: 'Issuer ID, Key ID, and Private Key are all required.',
					};
				}

				// Validate credentials by attempting to generate a JWT.
				// If sign() succeeds, the private key is a valid EC key. The actual
				// API permission is verified on the first node operation.
				try {
					const now = Math.floor(Date.now() / 1000);
					jwt.sign(
						{
							iss: issuerId,
							iat: now,
							exp: now + TOKEN_MAX_AGE_SECONDS,
							aud: 'appstoreconnect-v1',
						},
						privateKey,
						{ algorithm: 'ES256', header: { alg: 'ES256', kid: keyId, typ: 'JWT' } },
					);
				} catch (error) {
					return {
						status: 'Error',
						message: `Failed to generate JWT. Ensure your Private Key is a valid .p8 EC key (including BEGIN/END PRIVATE KEY headers). Error: ${(error as Error).message}`,
					};
				}

				return {
					status: 'OK',
					message:
						'JWT generated successfully. Credentials appear valid. Run a node operation to verify API permissions.',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let results: INodeExecutionData[] = [];

				if (resource === 'app') {
					results = await apps.execute.call(this, operation, i);
				} else if (resource === 'appStoreVersion') {
					results = await appStoreVersions.execute.call(this, operation, i);
				} else if (resource === 'review') {
					results = await reviews.execute.call(this, operation, i);
				} else if (resource === 'testflight') {
					results = await testflight.execute.call(this, operation, i);
				} else if (resource === 'salesReport') {
					results = await salesReports.execute.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
				}

				returnData.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
