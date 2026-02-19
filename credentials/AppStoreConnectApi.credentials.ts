import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AppStoreConnectApi implements ICredentialType {
	name = 'appStoreConnectApi';

	displayName = 'App Store Connect API';

	documentationUrl =
		'https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests';

	icon = 'file:appstoreconnect.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Issuer ID',
			name: 'issuerId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description:
				'Found in App Store Connect under Users and Access > Integrations > App Store Connect API. Shown at the top of the Keys page.',
		},
		{
			displayName: 'Key ID',
			name: 'keyId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'XXXXXXXXXX',
			description: 'The 10-character Key ID shown next to your API key in App Store Connect.',
		},
		{
			displayName: 'Private Key (.p8)',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 6,
			},
			default: '',
			required: true,
			placeholder: '-----BEGIN PRIVATE KEY-----\nMIGH...\n-----END PRIVATE KEY-----',
			description:
				'Paste the full contents of your .p8 file, including the BEGIN/END header lines. ' +
				'<b>macOS:</b> <code>cat AuthKey_XXXXXXXXXX.p8 | pbcopy</code> — then paste here. ' +
				'<b>Linux:</b> <code>cat AuthKey_XXXXXXXXXX.p8 | xclip -selection clipboard</code>. ' +
				'<b>Windows (PowerShell):</b> <code>Get-Content AuthKey_XXXXXXXXXX.p8 | Set-Clipboard</code>. ' +
				'This file can only be downloaded once from App Store Connect.',
		},
	];
}
