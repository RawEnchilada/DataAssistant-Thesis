export default class LayerCargo {
    private cargo: any;

    constructor(cargo: any = null) {
        this.cargo = cargo;
    }

    put(value: any): LayerCargo {
        this.cargo = value;
        return this;
    }

    take(): any {
        if (this.cargo === null) {
            throw new Error("LayerCargo is empty");
        }
        const c = this.cargo;
        this.cargo = null;
        return c;
    }
}