import IDBConnection from '../interfaces/IDBConnection'; // Assuming correct import paths for the interfaces
import ILayer from '../interfaces/ILayer';
import LayerCargo from './LayerCargo';

export default class DataCollectionLayer implements ILayer {
    private db: IDBConnection;

    constructor(db: IDBConnection) {
        this.db = db;
    }

    process(cargo: LayerCargo): LayerCargo {
        const input_data: string = cargo.take();
        if (typeof input_data !== 'string') {
            throw new Error('Input data must be a string.');
        }

        this.db.connect();
        const result = this.db.query(input_data);
        this.db.disconnect();

        cargo.put(result);
        return cargo;
    }
}