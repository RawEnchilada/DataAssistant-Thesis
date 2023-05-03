package dbassistant.layers

import dbassistant.interfaces.ILayer
import dbassistant.neural.QueryGenerator
import dbassistant.tokens.Tokenizer

class TokenizationLayer(
        private val tokenizer: Tokenizer,
        private val queryGenerator : QueryGenerator
) : ILayer{



    override fun pass(cargo:LayerCargo): LayerCargo {
        val input = cargo.take() as List<String>
        tokenizer.resetState()
        val tokens = tokenizer.encode(input)
        val output = queryGenerator.evaluate(tokens)
        val query = tokenizer.decode(output)
        cargo.put(query)
        return cargo
    }


}

