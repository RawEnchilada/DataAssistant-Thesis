import ILayer from '../interfaces/ILayer';

/**
 * @input string[]
 * @output string
 */
class QueryPreparationLayer implements ILayer {
    process(input: string[]): string {
        const output = input.join(' ');
        return output;
    }
}

export default QueryPreparationLayer;