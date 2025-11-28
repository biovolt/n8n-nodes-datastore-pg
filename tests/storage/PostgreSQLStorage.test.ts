import { PostgreSQLStorage, PostgreSQLConfig } from '../../nodes/Datastore/storage/PostgreSQLStorage';

describe('PostgreSQLStorage', () => {
	let storage: PostgreSQLStorage;
	const mockConfig: PostgreSQLConfig = {
		host: 'localhost',
		port: 5432,
		database: 'test_db',
		user: 'test_user',
		password: 'test_password',
		ssl: false,
		maxConnections: 5,
	};

	// Mock the pg module
	const mockClient = {
		query: jest.fn(),
		release: jest.fn(),
	};

	const mockPool = {
		connect: jest.fn().mockResolvedValue(mockClient),
		end: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		
		// Mock the pg module
		jest.doMock('pg', () => ({
			Pool: jest.fn().mockImplementation(() => mockPool),
		}));

		storage = new PostgreSQLStorage(mockConfig);
	});

	afterEach(async () => {
		if (storage) {
			await storage.close();
		}
		jest.resetModules();
	});

	describe('initialization', () => {
		it('should create table on first operation', async () => {
			mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

			await storage.set('testKey', 'testValue');

			expect(mockClient.query).toHaveBeenCalledWith(
				expect.stringContaining('CREATE TABLE IF NOT EXISTS datastore_values')
			);
			expect(mockClient.query).toHaveBeenCalledWith(
				expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_datastore_key')
			);
		});
	});

	describe('set and get operations', () => {
		beforeEach(() => {
			// Mock table creation queries
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE TABLE
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE INDEX
		});

		it('should store and retrieve a string value', async () => {
			// Mock the set operation
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
			
			// Mock the get operation
			mockClient.query.mockResolvedValueOnce({
				rows: [{ value: JSON.stringify('testValue') }],
				rowCount: 1,
			});

			await storage.set('testKey', 'testValue');
			const result = await storage.get('testKey');

			expect(result).toBe('testValue');
			expect(mockClient.query).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO datastore_values'),
				['testKey', JSON.stringify('testValue')]
			);
		});

		it('should store and retrieve a JSON object', async () => {
			const testObject = { name: 'test', count: 42 };
			
			// Mock the set operation
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
			
			// Mock the get operation
			mockClient.query.mockResolvedValueOnce({
				rows: [{ value: JSON.stringify(testObject) }],
				rowCount: 1,
			});

			await storage.set('testKey', testObject);
			const result = await storage.get('testKey');

			expect(result).toEqual(testObject);
		});

		it('should return undefined for non-existent key', async () => {
			// Mock empty result
			mockClient.query.mockResolvedValueOnce({
				rows: [],
				rowCount: 0,
			});

			const result = await storage.get('nonExistentKey');
			expect(result).toBeUndefined();
		});
	});

	describe('has operation', () => {
		beforeEach(() => {
			// Mock table creation queries
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE TABLE
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE INDEX
		});

		it('should return true for existing key', async () => {
			mockClient.query.mockResolvedValueOnce({
				rows: [{ '?column?': 1 }],
				rowCount: 1,
			});

			const exists = await storage.has('testKey');
			expect(exists).toBe(true);
		});

		it('should return false for non-existent key', async () => {
			mockClient.query.mockResolvedValueOnce({
				rows: [],
				rowCount: 0,
			});

			const exists = await storage.has('nonExistentKey');
			expect(exists).toBe(false);
		});
	});

	describe('delete operation', () => {
		beforeEach(() => {
			// Mock table creation queries
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE TABLE
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE INDEX
		});

		it('should delete existing key and return true', async () => {
			mockClient.query.mockResolvedValueOnce({
				rows: [],
				rowCount: 1,
			});

			const deleted = await storage.delete('testKey');
			expect(deleted).toBe(true);
			expect(mockClient.query).toHaveBeenCalledWith(
				'DELETE FROM datastore_values WHERE key = $1',
				['testKey']
			);
		});

		it('should return false for non-existent key', async () => {
			mockClient.query.mockResolvedValueOnce({
				rows: [],
				rowCount: 0,
			});

			const deleted = await storage.delete('nonExistentKey');
			expect(deleted).toBe(false);
		});
	});

	describe('clear operation', () => {
		beforeEach(() => {
			// Mock table creation queries
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE TABLE
			mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // CREATE INDEX
		});

		it('should clear all stored values', async () => {
			mockClient.query.mockResolvedValueOnce({
				rows: [],
				rowCount: 3, // Simulate 3 rows deleted
			});

			await storage.clear();

			expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM datastore_values');
		});
	});

	describe('error handling', () => {
		it('should handle database connection errors', async () => {
			mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));

			await expect(storage.set('testKey', 'testValue')).rejects.toThrow('Connection failed');
		});

		it('should handle query errors', async () => {
			mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

			await expect(storage.set('testKey', 'testValue')).rejects.toThrow('Query failed');
		});
	});
});