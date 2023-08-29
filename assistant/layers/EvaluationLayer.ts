import ILayer from '../interfaces/ILayer';
import QueryGenerator from '../neural/QueryGenerator';
import TokenSeries from '../tokens/TokenSeries';

/**
 * @input TokenSeries
 * @output TokenSeries
 */
export default class EvaluationLayer implements ILayer {
    private query_generator: QueryGenerator;

    constructor(query_generator: QueryGenerator) {
        this.query_generator = query_generator;
    }

    process(input: TokenSeries): TokenSeries {
        const output = this.query_generator.evaluate(input);
        return output;
    }
}
