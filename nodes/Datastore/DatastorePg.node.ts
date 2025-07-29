import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { datastoreNodeFields } from "./DatastorePg.description";
import { StorageFactory, StorageBackend } from './storage/StorageFactory';
import { PostgreSQLConfig } from './storage/PostgreSQLStorage';
import { IDataStorage } from './storage/IDataStorage';

export class DatastorePg implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Datastore PG',
		name: 'datastorePg',
		icon: 'fa:database',
		group: ['utility'],
		version: 1,
		subtitle: '={{$parameter["operation"]}} ({{$parameter["storageBackend"]}})',
		description: 'A configurable key-value datastore with support for in-memory and PostgreSQL storage.',
		defaults: {
			name: 'Datastore PG',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			...datastoreNodeFields,
		],
	};

	private static getStorage(executeFunctions: IExecuteFunctions, itemIndex: number = 0): IDataStorage {
		const storageBackend = executeFunctions.getNodeParameter('storageBackend', itemIndex, 'memory') as StorageBackend;
		
		if (storageBackend === 'postgresql') {
			const config: PostgreSQLConfig = {
				host: executeFunctions.getNodeParameter('pgHost', itemIndex) as string,
				port: executeFunctions.getNodeParameter('pgPort', itemIndex) as number,
				database: executeFunctions.getNodeParameter('pgDatabase', itemIndex) as string,
				user: executeFunctions.getNodeParameter('pgUser', itemIndex) as string,
				password: executeFunctions.getNodeParameter('pgPassword', itemIndex) as string,
				ssl: executeFunctions.getNodeParameter('pgSsl', itemIndex, false) as boolean,
				maxConnections: executeFunctions.getNodeParameter('pgMaxConnections', itemIndex, 10) as number,
			};
			return StorageFactory.createStorage('postgresql', config);
		}
		
		return StorageFactory.createStorage('memory');
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const outputForSetClear = this.getNodeParameter('outputForSetClear', 0, 'passThrough') as string;
		const storage = DatastorePg.getStorage(this, 0);

		if (operation === 'clearAll') {
			await storage.clear();
			if (items.length === 0) {
				if (outputForSetClear === 'status' || outputForSetClear === 'affectedValue' || outputForSetClear === 'affectedValueOnly') {
					returnData.push({ json: { success: true, operation: 'clearAll' } });
				}
				return [returnData];
			}
		}

		if (operation === 'set' && items.length > 1) {
			const firstKeyName = this.getNodeParameter('keyName', 0, '') as string;
			if (!firstKeyName) {
				throw new NodeOperationError(this.getNode(), 'Key Name is required for "Set" operation when processing multiple items for a single key.');
			}
			const firstValueDataType = this.getNodeParameter('valueDataType', 0, 'string') as string;

			let storeAsArrayForKey = true;
			for (let i = 1; i < items.length; i++) {
				const currentKeyName = this.getNodeParameter('keyName', i, '') as string;
				const currentValueDataType = this.getNodeParameter('valueDataType', i, 'string') as string;
				if (currentKeyName !== firstKeyName || currentValueDataType !== firstValueDataType) {
					storeAsArrayForKey = false;
					break;
				}
			}

			if (storeAsArrayForKey && firstValueDataType === 'json') {
				const inputArray = [];
				for (let i = 0; i < items.length; i++) {
					const jsonString = this.getNodeParameter('valueJson', i, '') as string;
					try {
						inputArray.push(jsonString);
					} catch (error) {
						throw new NodeOperationError(
							this.getNode(),
							`Invalid JSON provided for key "${firstKeyName}" in item ${i}: ${error.message}`,
							{ itemIndex: i },
						);
					}
				}
				await storage.set(firstKeyName, inputArray);

				if (outputForSetClear === 'status') {
					returnData.push({ json: { success: true, operation: 'set', key: firstKeyName, itemCount: items.length } });
				} else if (outputForSetClear === 'affectedValue') {
					returnData.push({ json: { success: true, operation: 'set', value: inputArray } });
				} else if (outputForSetClear === 'affectedValueOnly') {
					returnData.push({ json: { [firstKeyName]: inputArray } });
				} else {
					returnData.push(...items);
				}
				return [returnData];
			}
		}

		for (let i = 0; i < items.length; i++) {
			const keyName = operation !== 'clearAll' ? (this.getNodeParameter('keyName', i, '') as string) : '';
			const itemStorage = DatastorePg.getStorage(this, i);

			try {
				if (operation === 'set') {
					if (!keyName) {
						throw new NodeOperationError(this.getNode(), 'Key Name is required for "Set" operation.', { itemIndex: i });
					}
					const valueDataType = this.getNodeParameter('valueDataType', i, 'string') as string;
					let valueToStore: any;

					if (valueDataType === 'string') {
						valueToStore = this.getNodeParameter('valueString', i, '') as string;
					} else if (valueDataType === 'json') {
						const jsonString = this.getNodeParameter('valueJson', i, '') as string;
						try {
							valueToStore = JSON.parse(jsonString);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid JSON provided for key "${keyName}": ${error.message}`,
								{ itemIndex: i },
							);
						}
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown data type: ${valueDataType}`, {
							itemIndex: i,
						});
					}

					await itemStorage.set(keyName, valueToStore);

					if (outputForSetClear === 'status') {
						returnData.push({ json: { success: true, operation: 'set', key: keyName }, pairedItem: { item: i } });
					} else if (outputForSetClear === 'affectedValue') {
						returnData.push({ json: { success: true, operation: 'set', value: valueToStore }, pairedItem: { item: i } });
					} else if (outputForSetClear === 'affectedValueOnly') {
						returnData.push({ json: { [keyName]: valueToStore }, pairedItem: { item: i } });
					} else {
						returnData.push(items[i]);
					}
				} else if (operation === 'get') {
					if (!keyName) {
						throw new NodeOperationError(this.getNode(), 'Key Name is required for "Get" operation.', { itemIndex: i });
					}
					if (await itemStorage.has(keyName)) {
						const retrievedValue = await itemStorage.get(keyName);
						if (Array.isArray(retrievedValue)) {
							retrievedValue.forEach(val => {
								returnData.push({
									json: { key: keyName, value: val, found: true },
									pairedItem: { item: i },
								});
							});
						} else {
							returnData.push({
								json: { key: keyName, value: retrievedValue, found: true },
								pairedItem: { item: i },
							});
						}
					} else {
						returnData.push({
							json: { key: keyName, value: null, found: false },
							pairedItem: { item: i },
						});
					}
				} else if (operation === 'clear') {
					if (!keyName) {
						throw new NodeOperationError(this.getNode(), 'Key Name is required for "Clear" operation.', { itemIndex: i });
					}
					let valueBeforeClear: any = null;
					let keyExisted = false;
					if (outputForSetClear === 'affectedValue' && await itemStorage.has(keyName)) {
						valueBeforeClear = await itemStorage.get(keyName);
						keyExisted = true;
					}

					const cleared = await itemStorage.delete(keyName);

					if (outputForSetClear === 'status') {
						returnData.push({ json: { success: true, operation: 'clear', key: keyName, cleared }, pairedItem: { item: i } });
					} else if (outputForSetClear === 'affectedValue') {
						returnData.push({ json: { operation: 'clear', key: keyName, value: keyExisted ? valueBeforeClear : null, cleared }, pairedItem: { item: i } });
					} else if (outputForSetClear === 'affectedValueOnly') {
						returnData.push({ json: { [keyName]: keyExisted ? valueBeforeClear : null }, pairedItem: { item: i } });
					} else {
						returnData.push(items[i]);
					}
				} else if (operation === 'clearAll') {
					if (outputForSetClear === 'status' || outputForSetClear === 'affectedValue' || outputForSetClear === 'affectedValueOnly') {
						returnData.push({ json: { success: true, operation: 'clearAll' }, pairedItem: { item: i } });
					} else {
						returnData.push(items[i]);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
