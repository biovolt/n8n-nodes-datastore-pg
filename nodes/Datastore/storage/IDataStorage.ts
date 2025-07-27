export interface IDataStorage {
	set(key: string, value: any): Promise<void>;
	get(key: string): Promise<any>;
	has(key: string): Promise<boolean>;
	delete(key: string): Promise<boolean>;
	clear(): Promise<void>;
}