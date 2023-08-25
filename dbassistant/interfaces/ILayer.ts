import LayerCargo from '../layers/LayerCargo';

export default abstract class ILayer {
    abstract process(cargo: LayerCargo): LayerCargo;
}
