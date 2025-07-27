import type { INodeProperties } from 'n8n-workflow';

export const datastoreNodeFields: INodeProperties[] = [
	{
		displayName: 'Storage Backend',
		name: 'storageBackend',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'In-Memory',
				value: 'memory',
				description: 'Store data in memory (lost on restart)',
			},
			{
				name: 'PostgreSQL',
				value: 'postgresql',
				description: 'Store data in PostgreSQL database (persistent)',
			},
		],
		default: 'memory',
		description: 'Choose where to store the data',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Set',
				value: 'set',
				action: 'Set a key value pair',
				description: 'Store a value associated with a key',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a value by key',
				description: 'Retrieve a value using its key',
			},
			{
				name: 'Clear',
				value: 'clear',
				action: 'Clear a value by key',
				description: 'Remove a specific key-value pair',
			},
			{
				name: 'Clear All',
				value: 'clearAll',
				action: 'Clear all stored values',
				description: 'Remove all key-value pairs from the store',
			},
		],
		default: 'set',
	},

	// PostgreSQL Configuration Fields
	{
		displayName: 'Host',
		name: 'pgHost',
		type: 'string',
		default: 'localhost',
		required: true,
		description: 'PostgreSQL server host',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},
	{
		displayName: 'Port',
		name: 'pgPort',
		type: 'number',
		default: 5432,
		required: true,
		description: 'PostgreSQL server port',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},
	{
		displayName: 'Database',
		name: 'pgDatabase',
		type: 'string',
		default: '',
		required: true,
		description: 'PostgreSQL database name',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},
	{
		displayName: 'Username',
		name: 'pgUser',
		type: 'string',
		default: '',
		required: true,
		description: 'PostgreSQL username',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},
	{
		displayName: 'Password',
		name: 'pgPassword',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		description: 'PostgreSQL password',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},
	{
		displayName: 'SSL',
		name: 'pgSsl',
		type: 'boolean',
		default: false,
		description: 'Use SSL connection to PostgreSQL',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},
	{
		displayName: 'Max Connections',
		name: 'pgMaxConnections',
		type: 'number',
		default: 10,
		description: 'Maximum number of database connections in the pool',
		displayOptions: {
			show: {
				storageBackend: ['postgresql'],
			},
		},
	},

	// Common field for Set, Get, Clear
	{
		displayName: 'Key Name',
		name: 'keyName',
		type: 'string',
		default: '',
		required: true,
		description: 'The unique key for the data',
		displayOptions: {
			show: {
				operation: ['set', 'get', 'clear'],
			},
		},
	},

	// Fields for 'Set' operation
	{
		displayName: 'Value Data Type',
		name: 'valueDataType',
		type: 'options',
		options: [
			{
				name: 'String',
				value: 'string',
			},
			{
				name: 'JSON',
				value: 'json',
			},
		],
		default: 'string',
		displayOptions: {
			show: {
				operation: ['set'],
			},
		},
		description: 'The type of data to store as the value',
	},
	{
		displayName: 'Value',
		name: 'valueString',
		type: 'string',
		default: '',
		required: true,
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				operation: ['set'],
				valueDataType: ['string'],
			},
		},
		description: 'The string value to store',
	},
	{
		displayName: 'Value',
		name: 'valueJson',
		type: 'json',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['set'],
				valueDataType: ['json'],
			},
		},
		description: 'The JSON value to store',
	},
	{
		displayName: 'Output for Set/Clear',
		name: 'outputForSetClear',
		type: 'options',
		options: [
			{
				name: 'Pass Through',
				value: 'passThrough',
				description: 'Outputs the same data it received as input in full',
			},
			{
				name: 'Output Key',
				value: 'status',
				description: 'Outputs only status, operation and key',
			},
			{
				name: 'Output Value',
				value: 'affectedValue',
				description: 'Outputs only status, operation and saved value',
			},
			{
				name: 'Output Key-Value',
				value: 'affectedValueOnly',
				description: 'Outputs only key-value pair',
			},
		],
		default: 'passThrough',
		displayOptions: {
			show: {
				operation: ['set', 'clear', 'clearAll'],
			},
		},
		description: 'Define what the node should output after a Set or Clear operation',
	},
];
