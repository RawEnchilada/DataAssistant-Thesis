import GlossaryConversionLayer from './layers/GlossaryConversionLayer';
import DeTokenizationLayer from './layers/DeTokenizationLayer';
import EnTokenizationLayer from './layers/EnTokenizationLayer';
import EvaluationLayer from './layers/EvaluationLayer';
import PromptPreparationLayer from './layers/PromptPreparationLayer';
import QueryPreparationLayer from './layers/QueryPreparationLayer';
import QueryDatasetCreator from './neural/QueryDatasetCreator';
import QueryGenerator from './neural/QueryGenerator';
import Tokenizer from './tokens/Tokenizer';
import LayerPipeline from './layers/LayerPipeline';

export default class DataAssistant {
    private queryGenerator: QueryGenerator;
    private pipeline: LayerPipeline;

    constructor(query_generator: QueryGenerator, tokenizer: Tokenizer, prompt_size: number = 20) {
        this.queryGenerator = query_generator;
        this.pipeline = new LayerPipeline([
            new GlossaryConversionLayer(tokenizer),
            new PromptPreparationLayer(prompt_size),
            new EnTokenizationLayer(tokenizer),
            new EvaluationLayer(this.queryGenerator),
            new DeTokenizationLayer(tokenizer),
            new QueryPreparationLayer()
        ]);
    }

    evaluate(text: string): string {
        return this.pipeline.process(text);
    }
    
    train(train_file: string): void {
        this.queryGenerator.train(train_file);
    }

    loadModel(path: string): void {
        this.queryGenerator.loadModel(path);
    }

    saveModel(path: string): void {
        this.queryGenerator.saveModel(path);
    }

    loadLayers(path: string): void {
        this.queryGenerator.loadLayers(path);
    }

    saveLayers(path: string): void {
        this.queryGenerator.saveLayers(path);
    }

    convertData(from_path: string, to_path: string): void {
        const creator = new QueryDatasetCreator(
            this.queryGenerator.promptSize,
            this.queryGenerator.memorySize,
            this.queryGenerator.tokenizer
        );
        creator.load(from_path, to_path);
    }
}
