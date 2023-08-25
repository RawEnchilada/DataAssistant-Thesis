import ILayer from '../interfaces/ILayer';
import QueryGenerator from '../neural/QueryGenerator';
import TokenSeries from '../tokens/TokenSeries';
import LayerCargo from './LayerCargo';

export default class EvaluationLayer implements ILayer {
    private query_generator: QueryGenerator;

    constructor(query_generator: QueryGenerator) {
        this.query_generator = query_generator;
    }

    process(cargo: LayerCargo): LayerCargo {
        const input = cargo.take();
        if (!(input instanceof TokenSeries)) {
            throw new Error('Input must be an instance of TokenSeries');
        }

        const output = this.query_generator.evaluate(input);
        cargo.put(output);
        return cargo;
    }
}
