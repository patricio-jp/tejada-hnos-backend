import { DataSource } from "typeorm";
import { createAndInitializeDataSource } from "@config/typeorm.config";

export class DatabaseService {
  private static dataSource: DataSource;

  /**
   * Initializes the main data source.
   * @returns A promise that resolves with the initialized DataSource.
   */
  static async initialize(): Promise<DataSource> {
    try {
      this.dataSource = await createAndInitializeDataSource();
      console.log("🌿 Database connection established successfully.");
      return this.dataSource;
    } catch (error) {
      console.error("❌ Error connecting to the database:", error);
      throw error;
    }
  }

  /**
   * Get the PostgreSQL DataSource instance
   * @returns {DataSource}
   */
  static getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error("Database connection is not initialized or has been lost.");
    }
    return this.dataSource;
  }

  /**
   * Gracefully destroy the DataSource connection if initialized.
   */
  static async shutdown(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      try {
        await this.dataSource.destroy();
        console.log('🌿 Database connection closed.');
      } catch (e) {
        console.warn('Error while closing database connection:', e);
      }
    }
  }
}
