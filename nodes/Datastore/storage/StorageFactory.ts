import { IDataStorage } from './IDataStorage';
import { MemoryStorage } from './MemoryStorage';
import { PostgreSQLStorage, PostgreSQLConfig } from './PostgreSQLStorage';

export type StorageBackend = 'memory' | 'postgresql';

export class StorageFactory {
	private static storageInstances: Map<string, IDataStorage> = new Map();

	static createStorage(backend: StorageBackend, config?: PostgreSQLConfig): IDataStorage {
		if (backend === 'memory') {
			// Use singleton for memory storage
			const key = 'memory';
			if (!this.storageInstances.has(key)) {
				this.storageInstances.set(key, new MemoryStorage());
			}
			return this.storageInstances.get(key)!;
		}

		if (backend === 'postgresql') {
			if (!config) {
				throw new Error('PostgreSQL configuration is required for PostgreSQL backend');
			}
			// Create unique key based on connection details
			const key = `postgresql_${config.host}_${config.port}_${config.database}_${config.user}`;
			if (!this.storageInstances.has(key)) {
				this.storageInstances.set(key, new PostgreSQLStorage(config));
			}
			return this.storageInstances.get(key)!;
		}

		throw new Error(`Unknown storage backend: ${backend}`);
	}

	static async closeAll(): Promise<void> {
		for (const storage of this.storageInstances.values()) {
			if ('close' in storage && typeof storage.close === 'function') {
				await storage.close();
			}
		}
		this.storageInstances.clear();
	}
}