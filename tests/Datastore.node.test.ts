import { DatastorePg } from '../nodes/Datastore/DatastorePg.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

// Mock the storage factory
jest.mock('../nodes/Datastore/storage/StorageFactory');

describe('Datastore Node', () => {
	let datastore: Datastore;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockStorage: any;

	beforeEach(() => {
		jest.clearAllMocks();
		
		mockStorage = {
			set: jest.fn(),
			get: jest.fn(),
			has: jest.fn(),
			delete: jest.fn(),
			clear: jest.fn(),
		};

		mockExecuteFunctions = {
			getInputData: jest.fn(),
			getNodeParameter: jest.fn(),
			getNode: jest.fn().mockReturnValue({ id: 'test-node', name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
		};

		datastore = new DatastorePg();
		
		// Mock the getStorage method
		(datastore as any).getStorage = jest.fn().mockReturnValue(mockStorage);
	});

	describe('Set operation', () => {
		it('should store a string value', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('set') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('testKey') // keyName
				.mockReturnValueOnce('string') // valueDataType
				.mockReturnValueOnce('testValue'); // valueString

			mockStorage.set.mockResolvedValue(undefined);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.set).toHaveBeenCalledWith('testKey', 'testValue');
			expect(result[0]).toEqual(inputData);
		});

		it('should store a JSON value', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			const jsonValue = { name: 'test', count: 42 };
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('set') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('testKey') // keyName
				.mockReturnValueOnce('json') // valueDataType
				.mockReturnValueOnce(JSON.stringify(jsonValue)); // valueJson

			mockStorage.set.mockResolvedValue(undefined);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.set).toHaveBeenCalledWith('testKey', jsonValue);
			expect(result[0]).toEqual(inputData);
		});

		it('should return status output when configured', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('set') // operation
				.mockReturnValueOnce('status') // outputForSetClear
				.mockReturnValueOnce('testKey') // keyName
				.mockReturnValueOnce('string') // valueDataType
				.mockReturnValueOnce('testValue'); // valueString

			mockStorage.set.mockResolvedValue(undefined);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result[0]).toEqual([{
				json: { success: true, operation: 'set', key: 'testKey' },
				pairedItem: { item: 0 }
			}]);
		});
	});

	describe('Get operation', () => {
		it('should retrieve an existing value', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('testKey'); // keyName

			mockStorage.has.mockResolvedValue(true);
			mockStorage.get.mockResolvedValue('testValue');

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.has).toHaveBeenCalledWith('testKey');
			expect(mockStorage.get).toHaveBeenCalledWith('testKey');
			expect(result[0]).toEqual([{
				json: { key: 'testKey', value: 'testValue', found: true },
				pairedItem: { item: 0 }
			}]);
		});

		it('should handle non-existent key', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('nonExistentKey'); // keyName

			mockStorage.has.mockResolvedValue(false);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.has).toHaveBeenCalledWith('nonExistentKey');
			expect(result[0]).toEqual([{
				json: { key: 'nonExistentKey', value: null, found: false },
				pairedItem: { item: 0 }
			}]);
		});

		it('should handle array values', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			const arrayValue = ['item1', 'item2', 'item3'];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('arrayKey'); // keyName

			mockStorage.has.mockResolvedValue(true);
			mockStorage.get.mockResolvedValue(arrayValue);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result[0]).toHaveLength(3);
			expect(result[0][0]).toEqual({
				json: { key: 'arrayKey', value: 'item1', found: true },
				pairedItem: { item: 0 }
			});
			expect(result[0][1]).toEqual({
				json: { key: 'arrayKey', value: 'item2', found: true },
				pairedItem: { item: 0 }
			});
			expect(result[0][2]).toEqual({
				json: { key: 'arrayKey', value: 'item3', found: true },
				pairedItem: { item: 0 }
			});
		});
	});

	describe('Clear operation', () => {
		it('should delete an existing key', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('clear') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('testKey'); // keyName

			mockStorage.delete.mockResolvedValue(true);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.delete).toHaveBeenCalledWith('testKey');
			expect(result[0]).toEqual(inputData);
		});

		it('should return status when configured', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('clear') // operation
				.mockReturnValueOnce('status') // outputForSetClear
				.mockReturnValueOnce('testKey'); // keyName

			mockStorage.delete.mockResolvedValue(true);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result[0]).toEqual([{
				json: { success: true, operation: 'clear', key: 'testKey', cleared: true },
				pairedItem: { item: 0 }
			}]);
		});
	});

	describe('Clear All operation', () => {
		it('should clear all values', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('clearAll') // operation
				.mockReturnValueOnce('passThrough'); // outputForSetClear

			mockStorage.clear.mockResolvedValue(undefined);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.clear).toHaveBeenCalled();
			expect(result[0]).toEqual(inputData);
		});

		it('should handle empty input data', async () => {
			const inputData: INodeExecutionData[] = [];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('clearAll') // operation
				.mockReturnValueOnce('status'); // outputForSetClear

			mockStorage.clear.mockResolvedValue(undefined);

			const result = await datastore.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockStorage.clear).toHaveBeenCalled();
			expect(result[0]).toEqual([{
				json: { success: true, operation: 'clearAll' }
			}]);
		});
	});

	describe('Error handling', () => {
		it('should throw error for set operation without key name', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('set') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce(''); // keyName (empty)

			await expect(datastore.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow('Key Name is required for "Set" operation.');
		});

		it('should throw error for invalid JSON', async () => {
			const inputData: INodeExecutionData[] = [{ json: {} }];
			
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('set') // operation
				.mockReturnValueOnce('passThrough') // outputForSetClear
				.mockReturnValueOnce('testKey') // keyName
				.mockReturnValueOnce('json') // valueDataType
				.mockReturnValueOnce('invalid json'); // valueJson

			await expect(datastore.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow();
		});
	});
});