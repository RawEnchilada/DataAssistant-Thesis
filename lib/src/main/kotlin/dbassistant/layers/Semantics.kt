package dbassistant.layers

import dbassistant.interfaces.ILayer
import dbassistant.analysis.Logging
import dbassistant.neural.QueryGenerator
import dbassistant.preprocessing.Tokenizer
import dbassistant.preprocessing.WordMap

class Semantics(
        private val wordMap: WordMap,
        private val ai : QueryGenerator
) : ILayer {

    private val tokenizer = Tokenizer(wordMap)


    override fun pass(input: String): String {
        wordMap.clearArguments()
        val tokens = tokenizer.encode(input)

        val output = ai.evaluate(tokens)
        Logging.println("    Output tokens: $output")

        val query = tokenizer.decode(output)
        return query
    }


}

