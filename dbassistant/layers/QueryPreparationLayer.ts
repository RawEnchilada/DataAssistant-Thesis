import ILayer from '../interfaces/ILayer';
import LayerCargo from './LayerCargo';

class QueryPreparationLayer implements ILayer {
    process(cargo: LayerCargo): LayerCargo {
        const input = cargo.take();
        if (typeof input[0] !== 'string') {
            throw new Error('Input should be a string');
        }
        const output = input.join(' ');
        cargo.put(output);
        return cargo;
    }
}

export default QueryPreparationLayer;