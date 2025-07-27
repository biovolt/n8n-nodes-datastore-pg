import { MemoryStorage } from '../../nodes/Datastore/storage/MemoryStorage';

describe('MemoryStorage', () => {
	let storage: MemoryStorage;

	beforeEach(() => {
		storage = new MemoryStorage();
	});

	afterEach(async () => {
		await storage.clear();
	});

	describe('set and get operations', () => {
		it('should store and retrieve a string value', async () => {
			await storage.set('testKey', 'testValue');
			const result = await storage.get('testKey');
			expect(result).toBe('testValue');
		});

		it('should store and retrieve a JSON object', async () => {
			const testObject = { name: 'test', count: 42 };
			await storage.set('testKey', testObject);
			const result = await storage.get('testKey');
			expect(result).toEqual(testObject);
		});

		it('should return undefined for non-existent key', async () => {
			const result = await storage.get('nonExistentKey');
			expect(result).toBeUndefined();
		});

		it('should overwrite existing values', async () => {
			await storage.set('testKey', 'oldValue');
			await storage.set('testKey', 'newValue');
			const result = await storage.get('testKey');
			expect(result).toBe('newValue');
		});
	});

	describe('has operation', () => {
		it('should return true for existing key', async () => {
			await storage.set('testKey', 'testValue');
			const exists = await storage.has('testKey');
			expect(exists).toBe(true);
		});

		it('should return false for non-existent key', async () => {
			const exists = await storage.has('nonExistentKey');
			expect(exists).toBe(false);
		});
	});

	describe('delete operation', () => {
		it('should delete existing key and return true', async () => {
			await storage.set('testKey', 'testValue');
			const deleted = await storage.delete('testKey');
			expect(deleted).toBe(true);
			
			const exists = await storage.has('testKey');
			expect(exists).toBe(false);
		});

		it('should return false for non-existent key', async () => {
			const deleted = await storage.delete('nonExistentKey');
			expect(deleted).toBe(false);
		});
	});

	describe('clear operation', () => {
		it('should clear all stored values', async () => {
			await storage.set('key1', 'value1');
			await storage.set('key2', 'value2');
			await storage.set('key3', 'value3');

			await storage.clear();

			expect(await storage.has('key1')).toBe(false);
			expect(await storage.has('key2')).toBe(false);
			expect(await storage.has('key3')).toBe(false);
		});
	});

	describe('array handling', () => {
		it('should store and retrieve arrays', async () => {
			const testArray = [1, 2, 3, 'test'];
			await storage.set('arrayKey', testArray);
			const result = await storage.get('arrayKey');
			expect(result).toEqual(testArray);
		});
	});
});