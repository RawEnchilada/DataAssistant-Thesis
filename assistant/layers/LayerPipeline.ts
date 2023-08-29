import ILayer from "../interfaces/ILayer";

export default class LayerPipeline {
    private layers: Array<ILayer>;

    constructor(layers: Array<ILayer>) {
        this.layers = layers;
    }

    process(data: string): string {
        let cargo:any = data;
        this.layers.forEach(layer => {
            cargo = layer.process(cargo);
        });
        return cargo;
    }
}