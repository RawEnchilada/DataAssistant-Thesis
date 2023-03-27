package graphai.preprocessing

import graphai.interfaces.IGlossary
import kotlinx.coroutines.*

data class Tokens(
    val tokens:Array<Int>,
    val arguments:Array<String>,
    val maxToken: Int
){
    val normalizedTokens:Array<Float>
    get() {
        val maxFloat =maxToken.toFloat()
        return tokens.map{
            t -> t.toFloat() / maxFloat
        }.toTypedArray()
    }
}

class Tokenizer(
    glossary: IGlossary
) {

    private val wordMap = WordMap(glossary)

    private val maxVariableCount = 100

    fun encode(input: String): Tokens = runBlocking {
        val prompt = input.replace(Regex("[^A-Za-z0-9]")," ").split(" ")

        val arguments = mutableListOf<String>()
        var tokens = MutableList(prompt.size*2){-1}

        val tasks = prompt.mapIndexed{ index, token ->
            launch {
                val id = wordMap.encode(token)
                tokens[index*2] = (maxVariableCount + id)
                if(wordMap.isKnownClass(id)){
                    tokens[index*2+1] = arguments.size
                    arguments.add(token)
                }
            }
        }

        tasks.joinAll()

        tokens = tokens.filter { t -> t != -1 }.toMutableList()

        Tokens(tokens.toTypedArray(),arguments.toTypedArray(),maxVariableCount+wordMap.maxId)
    }

    fun decode(input: Tokens): String {
        var text = ""
        for(token in input.tokens){
            if(token < maxVariableCount){
                text += " ${input.arguments[token]}"
            }
            else{
                text += " ${wordMap.decode(token-maxVariableCount)}"
            }
        }
        return text
    }


}



