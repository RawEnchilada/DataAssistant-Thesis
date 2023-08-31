import {GlossaryTokenHandler} from '../tokenhandlers/GlossaryTokenHandler';

export default interface IGlossaryHandlerFactory {
    build(priority: number): Promise<GlossaryTokenHandler>;
}
