import * as jwt from 'jsonwebtoken';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INode,
} from 'n8n-workflow';
import * as zlib from 'zlib';

const BASE_URL = 'https://api.appstoreconnect.apple.com/v1';
const TOKEN_MAX_AGE_SECONDS = 1200; // Apple's hard maximum: 20 minutes

/**
 * Generates an ES256-signed JWT for App Store Connect API authentication.
 *
 * Apple requires:
 * - Algorithm: ES256 (mandatory — not the jsonwebtoken default)
 * - Audience: "appstoreconnect-v1"
 * - Expiry: max 1200 seconds (20 minutes)
 * - Header: { alg: "ES256", kid: "<Key ID>", typ: "JWT" }
 */
function generateJWT(issuerId: string, keyId: string, privateKey: string): string {
	const now = Math.floor(Date.now() / 1000);
	return jwt.sign(
		{
			iss: issuerId,
			iat: now,
			exp: now + TOKEN_MAX_AGE_SECONDS,
			aud: 'appstoreconnect-v1',
		},
		privateKey,
		{
			algorithm: 'ES256',
			header: { alg: 'ES256', kid: keyId, typ: 'JWT' },
		},
	);
}

async function getCredentialsAndToken(
	executeFunctions: IExecuteFunctions,
): Promise<{ token: string; node: INode }> {
	const credentials = await executeFunctions.getCredentials('appStoreConnectApi');
	const issuerId = credentials.issuerId as string;
	const keyId = credentials.keyId as string;
	const privateKey = credentials.privateKey as string;

	if (!issuerId || !keyId || !privateKey) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'App Store Connect credentials are incomplete. Please set Issuer ID, Key ID, and Private Key.',
		);
	}

	let token: string;
	try {
		token = generateJWT(issuerId, keyId, privateKey);
	} catch (error) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Failed to generate JWT token. Ensure your Private Key (.p8) is pasted correctly, including the "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" lines. Error: ${(error as Error).message}`,
		);
	}

	return { token, node: executeFunctions.getNode() };
}

/**
 * Makes a single authenticated request to the App Store Connect API.
 */
export async function apiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	const { token, node } = await getCredentialsAndToken(this);

	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		qs,
		json: true,
	};

	if (method !== 'GET' && method !== 'DELETE' && Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		return (await this.helpers.httpRequest(options)) as IDataObject;
	} catch (error) {
		handleApiError(error as ApiError, node);
	}
}

/**
 * Fetches all pages of a paginated App Store Connect API list endpoint.
 * Follows the `links.next` cursor until absent.
 */
export async function apiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	limit?: number,
): Promise<IDataObject[]> {
	const { token, node } = await getCredentialsAndToken(this);

	const results: IDataObject[] = [];
	let nextUrl: string | undefined = undefined;

	do {
		// Refresh token for long-running paginations (token valid 20 min)
		const currentToken =
			results.length > 0
				? (await getCredentialsAndToken(this)).token
				: token;

		const options: IHttpRequestOptions = {
			method,
			url: nextUrl ?? `${BASE_URL}${endpoint}`,
			headers: {
				Authorization: `Bearer ${currentToken}`,
			},
			// On first request: use provided qs + page size; subsequent: use full nextUrl as-is
			qs: nextUrl ? {} : { ...qs, limit: limit ?? 200 },
			json: true,
		};

		let response: IDataObject;
		try {
			response = (await this.helpers.httpRequest(options)) as IDataObject;
		} catch (error) {
			handleApiError(error as ApiError, node);
		}

		const data = (response!.data as IDataObject[]) ?? [];
		results.push(...data);

		const links = response!.links as IDataObject | undefined;
		nextUrl = links?.next as string | undefined;
	} while (nextUrl);

	return results;
}

/**
 * Downloads a gzip-compressed report from App Store Connect.
 * Returns the decompressed raw Buffer (TSV content).
 */
export async function apiRequestReport(
	this: IExecuteFunctions,
	endpoint: string,
	qs: IDataObject,
): Promise<Buffer | null> {
	const { token, node } = await getCredentialsAndToken(this);

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${BASE_URL}${endpoint}`,
		headers: {
			Authorization: `Bearer ${token}`,
			'Accept-Encoding': 'gzip',
		},
		qs,
		encoding: 'arraybuffer',
		returnFullResponse: true,
	};

	let response: { statusCode: number; body: Buffer };
	try {
		response = (await this.helpers.httpRequest(options)) as { statusCode: number; body: Buffer };
	} catch (error) {
		const apiError = error as ApiError;
		// 404 for reports = "not yet generated" — not an error, return null
		if (apiError.response?.status === 404 || apiError.statusCode === 404) {
			return null;
		}
		handleApiError(apiError, node);
	}

	const rawBuffer = Buffer.isBuffer(response!.body)
		? response!.body
		: Buffer.from(response!.body as unknown as ArrayBuffer);

	try {
		return zlib.gunzipSync(rawBuffer);
	} catch {
		// Not gzipped — return as-is (some environments decompress automatically)
		return rawBuffer;
	}
}

interface ApiError {
	response?: {
		status?: number;
		headers?: Record<string, string>;
		body?: {
			errors?: Array<{ status?: string; code?: string; title?: string; detail?: string }>;
		};
	};
	statusCode?: number;
	message?: string;
}

function handleApiError(error: ApiError, node: INode): never {
	const status = error.response?.status ?? error.statusCode;
	const apiErrors = error.response?.body?.errors ?? [];
	const detail =
		apiErrors.length > 0
			? apiErrors.map((e) => e.detail ?? e.title ?? e.code).join('; ')
			: error.message;

	const rateLimitHeader = error.response?.headers?.['x-rate-limit'] ?? '';
	const remaining = rateLimitHeader.match(/user-hour-rem:(\d+)/)?.[1];

	switch (status) {
		case 401:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message:
					'Authentication failed. Verify your Issuer ID, Key ID, and Private Key (.p8) in your App Store Connect API credentials.',
				httpCode: '401',
			});
		case 403:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message: `Insufficient permissions: ${detail}. Check the role assigned to your App Store Connect API key.`,
				httpCode: '403',
			});
		case 404:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message: `Resource not found: ${detail}`,
				httpCode: '404',
			});
		case 409:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message: detail ?? 'Conflict: the resource already exists or cannot be modified in its current state.',
				httpCode: '409',
			});
		case 422:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message: `Validation error: ${detail}`,
				httpCode: '422',
			});
		case 429:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message: `Rate limit reached (3,600 requests/hour).${remaining ? ` Remaining this hour: ${remaining}.` : ''} Retry after the current hour window resets.`,
				httpCode: '429',
			});
		default:
			throw new NodeApiError(node, { message: error.message ?? '' }, {
				message: detail ?? 'An unexpected error occurred.',
				httpCode: String(status ?? 'unknown'),
			});
	}
}
