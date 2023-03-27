package graphai.layers

import graphai.interfaces.IGlossary
import graphai.interfaces.ILayer
import graphai.neural.QueryGenerator
import graphai.preprocessing.Tokenizer

class Semantics(
    glossary: IGlossary,
    private val ai : QueryGenerator
) : ILayer {

    private val tokenizer = Tokenizer(glossary)


    override fun pass(input: String): String {
        val tokens = tokenizer.encode(input)

        val output = ai.evaluate(tokens)

        val query = tokenizer.decode(output)
        return input
    }


}

