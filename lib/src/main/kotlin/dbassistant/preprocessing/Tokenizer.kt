package dbassistant.preprocessing

data class Tokens(
    val tokens:Array<Int>,
    val wordMap: WordMap
){
    val normalizedTokens:Array<Float>
    get() {
        val maxFloat = wordMap.maxOverallId.toFloat()
        return tokens.map{
            t -> t.toFloat() / maxFloat
        }.toTypedArray()
    }

    /**
     * @return [Tokens] - a new Tokens object containing the selected elements from this object
     */
    fun slice(start:Int, end:Int): Tokens {
        return Tokens(tokens.sliceArray(start until end),wordMap)
    }

    /**
     * @return [Tokens] - a new Tokens object
     */
    fun append(tokens: Tokens): Tokens {
        val newTokens = this.tokens.toMutableList()
        newTokens.addAll(tokens.tokens)
        return Tokens(newTokens.toTypedArray(),wordMap)
    }

    /**
     * @return [Tokens] - a new tokens object containing the last n tokens from this object. Empty spaces are filled the given value when needed.
     */
    fun lastN(n:Int,fillerValue:Int): Tokens {
        val list = MutableList(n,fun(_:Int):Int{return fillerValue})
        val lastN = tokens.takeLast(n).reversed()
        var index = n
        for(ltoken in lastN){
            index--
            list[index] = ltoken
        }
        return Tokens(list.toTypedArray(),wordMap)
    }
    
    override fun toString():String{
        var text = "|"
        for(t in tokens){
            text += "$t|"
        }
        return text
    }


}

/**
 * Class responsible for preparing the input prompt for the model
 */
class Tokenizer(
    private val wordMap: WordMap
) {

    /**
     * Encodes a series of words into assigned ids,
     * returned tokens' length is fixed to the model's input size (wordMap.promptSize, filled with empty tokens '_' wherever needed)
     * @return [Tokens] - The encoded prompt
     */
    fun encode(input: String): Tokens {
        val prompt = preparePrompt(input)
        var tokens = MutableList(wordMap.maxPromptSize*2){-10}

        for(index in prompt.indices){
            val token = prompt[index]
            val id = wordMap.encodeToken(token)
            tokens[index*2] = (id)
            if(wordMap.glossary.isKey(id)){
                val aid = wordMap.encodeArgument(token)
                tokens[index*2+1] = aid
            }
        }
        tokens = tokens.filter { t -> t != -10 }.toMutableList()
        tokens.add(wordMap.endTokenId) //closing element
        for(index in tokens.size until wordMap.maxPromptSize){
            tokens.add(wordMap.encodeToken("_"))
        }


        return Tokens(tokens.toTypedArray(),wordMap)
    }


    /**
     * Decodes a series of assigned ids back into a readable prompt
     * @return [String] - The decoded prompt
     */
    fun decode(input: Tokens): String {
        var text = ""
        for(token in input.tokens){
            text += " ${wordMap.decode(token)}"
        }
        return text
    }


    private fun preparePrompt(raw:String):List<String>{
        val specialCharacter = Regex("[^A-z0-9 @]")
        
        var spaced = ""
        for(char in raw.replace("\"","")){
            if(specialCharacter.matches(char.toString())){
                spaced += " $char "
            }
            else{
                spaced += char
            }
        }
        spaced = spaced.replace(Regex(" +")," ")
        val symbols = spaced.split(" ")
        return symbols
    }

}



