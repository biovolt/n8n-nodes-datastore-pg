import { IDataStorage } from './IDataStorage';

export class MemoryStorage implements IDataStorage {
	private static memoryStore: Map<string, any> = new Map();

	async set(key: string, value: any): Promise<void> {
		MemoryStorage.memoryStore.set(key, value);
	}

	async get(key: string): Promise<any> {
		return MemoryStorage.memoryStore.get(key);
	}

	async has(key: string): Promise<boolean> {
		return MemoryStorage.memoryStore.has(key);
	}

	async delete(key: string): Promise<boolean> {
		return MemoryStorage.memoryStore.delete(key);
	}

	async clear(): Promise<void> {
		MemoryStorage.memoryStore.clear();
	}
}