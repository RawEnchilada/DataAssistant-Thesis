

export default class Graph{
    private _nodes:{classes:string[],data:{id:string}}[] = [];
    private _edges:{data:{source:string,target:string,weight:number}}[] = [];

    public addNode(id:string, group:string, parent: string|undefined = undefined):void{
        let node = this._nodes.find((n) => (n.data.id === id));
        if(node === undefined){
            node = {
                classes: [group],
                data:{
                    id: id
                }
            };
            this._nodes.push(node);
        }
        
        if(parent !== undefined){
            const target = node.data.id;
            const source = parent;
            const edge = this._edges.find((edge)=>(edge.data.source === source && edge.data.target === target));
            if(edge === undefined){
                this._edges.push({
                    data:{
                        source: source,
                        target: target,
                        weight: 1
                    }
                });
            }else{
                edge.data.weight++;
            }
        }
    }

    public export():string{
return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Tokenization Graph</title>
        <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js" type="text/javascript"></script>
        <style>
            html,body,#cy{margin:0;width:100%;height:100%;}
        </style>
    </head>
    <body>
        <div id="cy"></div>
        <script>
            cytoscape.use(avsdf);
            var cy = cytoscape({
                container: document.getElementById('cy'),
                elements: {
                    nodes:${JSON.stringify(this._nodes)},
                    edges:${JSON.stringify(this._edges)}
                },
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(id)',
                            'text-valign': 'center',
                            'text-halign': 'bottom'
                    }},{
                        selector: 'edge',
                        style: {
                            'curve-style': 'bezier',
                            'target-arrow-shape': 'triangle',
                            'width': 'data(weight)/10'
                    }},{
                        selector: 'node.END',
                        style: {
                          'background-color': 'red'
                    }},{
                        selector: 'node.EMPTY',
                        style:{
                            'background-color': 'green'
                    }},{
                        selector: 'node.GENERIC',
                        style:{
                            'background-color': 'yellow'
                    }},{
                        selector: 'node.ARGUMENT',
                        style:{
                            'background-color': 'purple'
                    }},{
                        selector: 'node.CLASS',
                        style:{
                            'background-color': 'orange'
                    }},{
                        selector: 'node.KEY',
                        style:{
                            'background-color': 'blue'
                    }}
                ],
                layout:{
                    name: 'cose',
                    directed: true,
                    fit: true,
                    padding: 30,
                    nodeDimensionsIncludeLabels: true
                }
            });
        </script>
    </body>
</html>`
    }
}