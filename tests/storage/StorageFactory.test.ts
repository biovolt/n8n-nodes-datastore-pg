import { StorageFactory } from '../../nodes/Datastore/storage/StorageFactory';
import { MemoryStorage } from '../../nodes/Datastore/storage/MemoryStorage';
import { PostgreSQLStorage, PostgreSQLConfig } from '../../nodes/Datastore/storage/PostgreSQLStorage';

// Mock the PostgreSQLStorage
jest.mock('../../nodes/Datastore/storage/PostgreSQLStorage');

describe('StorageFactory', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await StorageFactory.closeAll();
	});

	describe('createStorage', () => {
		it('should create a MemoryStorage instance for memory backend', () => {
			const storage = StorageFactory.createStorage('memory');
			expect(storage).toBeInstanceOf(MemoryStorage);
		});

		it('should return the same MemoryStorage instance on subsequent calls', () => {
			const storage1 = StorageFactory.createStorage('memory');
			const storage2 = StorageFactory.createStorage('memory');
			expect(storage1).toBe(storage2);
		});

		it('should create a PostgreSQLStorage instance for postgresql backend', () => {
			const config: PostgreSQLConfig = {
				host: 'localhost',
				port: 5432,
				database: 'test_db',
				user: 'test_user',
				password: 'test_password',
			};

			const storage = StorageFactory.createStorage('postgresql', config);
			expect(PostgreSQLStorage).toHaveBeenCalledWith(config);
			expect(storage).toBeInstanceOf(PostgreSQLStorage);
		});

		it('should return the same PostgreSQLStorage instance for identical configs', () => {
			const config: PostgreSQLConfig = {
				host: 'localhost',
				port: 5432,
				database: 'test_db',
				user: 'test_user',
				password: 'test_password',
			};

			const storage1 = StorageFactory.createStorage('postgresql', config);
			const storage2 = StorageFactory.createStorage('postgresql', config);
			
			expect(storage1).toBe(storage2);
			expect(PostgreSQLStorage).toHaveBeenCalledTimes(1);
		});

		it('should create different PostgreSQLStorage instances for different configs', () => {
			const config1: PostgreSQLConfig = {
				host: 'localhost',
				port: 5432,
				database: 'test_db1',
				user: 'test_user',
				password: 'test_password',
			};

			const config2: PostgreSQLConfig = {
				host: 'localhost',
				port: 5432,
				database: 'test_db2',
				user: 'test_user',
				password: 'test_password',
			};

			const storage1 = StorageFactory.createStorage('postgresql', config1);
			const storage2 = StorageFactory.createStorage('postgresql', config2);
			
			expect(storage1).not.toBe(storage2);
			expect(PostgreSQLStorage).toHaveBeenCalledTimes(2);
		});

		it('should throw error for postgresql backend without config', () => {
			expect(() => {
				StorageFactory.createStorage('postgresql');
			}).toThrow('PostgreSQL configuration is required for PostgreSQL backend');
		});

		it('should throw error for unknown backend', () => {
			expect(() => {
				StorageFactory.createStorage('unknown' as any);
			}).toThrow('Unknown storage backend: unknown');
		});
	});

	describe('closeAll', () => {
		it('should call close on all storage instances that have close method', async () => {
			const mockClose = jest.fn();
			(PostgreSQLStorage as jest.MockedClass<typeof PostgreSQLStorage>).mockImplementation(() => ({
				close: mockClose,
			} as any));

			const config: PostgreSQLConfig = {
				host: 'localhost',
				port: 5432,
				database: 'test_db',
				user: 'test_user',
				password: 'test_password',
			};

			StorageFactory.createStorage('memory');
			StorageFactory.createStorage('postgresql', config);

			await StorageFactory.closeAll();

			expect(mockClose).toHaveBeenCalledTimes(1);
		});

		it('should not throw error if storage instance does not have close method', async () => {
			StorageFactory.createStorage('memory');
			
			await expect(StorageFactory.closeAll()).resolves.not.toThrow();
		});
	});
});