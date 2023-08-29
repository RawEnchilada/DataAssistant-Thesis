import IDBConnection from '../interfaces/IDBConnection'; // Assuming correct import paths for the interfaces
import ILayer from '../interfaces/ILayer';

/**
 * @input: string
 * @output: Promise<Array<{ [key: string]: any }>>
 */
export default class DataCollectionLayer implements ILayer {
    private db: IDBConnection;

    constructor(db: IDBConnection) {
        this.db = db;
    }

    process(input: string): Promise<Array<{ [key: string]: any }>> {
        this.db.connect();
        const result = this.db.query(input);
        this.db.disconnect();

        return result;
    }
}