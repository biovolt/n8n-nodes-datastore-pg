import { IDataStorage } from './IDataStorage';
import { Pool } from 'pg';

export interface PostgreSQLConfig {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
	ssl?: boolean;
	maxConnections?: number;
}

export class PostgreSQLStorage implements IDataStorage {
	private pool: Pool;
	private initialized = false;

	constructor(config: PostgreSQLConfig) {
		this.pool = new Pool({
			host: config.host,
			port: config.port,
			database: config.database,
			user: config.user,
			password: config.password,
			ssl: config.ssl ? { rejectUnauthorized: false } : false,
			max: config.maxConnections || 10,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
		});
	}

	private async ensureTableExists(): Promise<void> {
		if (this.initialized) return;

		const createTableQuery = `
			CREATE TABLE IF NOT EXISTS datastore_values (
				id SERIAL PRIMARY KEY,
				key VARCHAR(255) UNIQUE NOT NULL,
				value JSONB NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`;

		const createIndexQuery = `
			CREATE INDEX IF NOT EXISTS idx_datastore_key ON datastore_values(key)
		`;

		const client = await this.pool.connect();
		try {
			await client.query(createTableQuery);
			await client.query(createIndexQuery);
			this.initialized = true;
		} finally {
			client.release();
		}
	}

	async set(key: string, value: any): Promise<void> {
		await this.ensureTableExists();
		
		const query = `
			INSERT INTO datastore_values (key, value, updated_at)
			VALUES ($1, $2, CURRENT_TIMESTAMP)
			ON CONFLICT (key)
			DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
		`;

		const client = await this.pool.connect();
		try {
			await client.query(query, [key, JSON.stringify(value)]);
		} finally {
			client.release();
		}
	}

	async get(key: string): Promise<any> {
		await this.ensureTableExists();
		
		const query = 'SELECT value FROM datastore_values WHERE key = $1';
		
		const client = await this.pool.connect();
		try {
			const result = await client.query(query, [key]);
			if (result.rows.length === 0) {
				return undefined;
			}
			const value = result.rows[0].value;
			// If value is already an object (JSONB returns objects), return as-is
			// If it's a string, parse it
			return typeof value === 'string' ? JSON.parse(value) : value;
		} finally {
			client.release();
		}
	}

	async has(key: string): Promise<boolean> {
		await this.ensureTableExists();
		
		const query = 'SELECT 1 FROM datastore_values WHERE key = $1';
		
		const client = await this.pool.connect();
		try {
			const result = await client.query(query, [key]);
			return result.rows.length > 0;
		} finally {
			client.release();
		}
	}

	async delete(key: string): Promise<boolean> {
		await this.ensureTableExists();
		
		const query = 'DELETE FROM datastore_values WHERE key = $1';
		
		const client = await this.pool.connect();
		try {
			const result = await client.query(query, [key]);
			return result.rowCount !== null && result.rowCount > 0;
		} finally {
			client.release();
		}
	}

	async clear(): Promise<void> {
		await this.ensureTableExists();
		
		const query = 'DELETE FROM datastore_values';
		
		const client = await this.pool.connect();
		try {
			await client.query(query);
		} finally {
			client.release();
		}
	}

	async close(): Promise<void> {
		await this.pool.end();
	}
}