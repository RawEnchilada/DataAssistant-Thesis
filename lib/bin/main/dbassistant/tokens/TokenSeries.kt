package dbassistant.tokens

data class TokenSeries(
    val tokens:Array<Int>
){
    
    fun normalizeTokens(maxId:Int):Array<Float>{
        val maxFloat = maxId.toFloat()
        return tokens.map{
            t -> t.toFloat() / maxFloat
        }.toTypedArray()
    }

    /**
     * @return [TokenSeries] - a new Tokens object containing the selected elements from this object
     */
    fun slice(start:Int, end:Int): TokenSeries {
        return TokenSeries(tokens.sliceArray(start until end))
    }

    /**
     * @return [TokenSeries] - a new Tokens object
     */
    fun append(tokens: TokenSeries): TokenSeries {
        val newTokens = this.tokens.toMutableList()
        newTokens.addAll(tokens.tokens)
        return TokenSeries(newTokens.toTypedArray())
    }

    /**
     * @return [TokenSeries] - a new tokens object containing the last n tokens from this object. Empty spaces are filled the given value when needed.
     */
    fun lastN(n:Int,fillerValue:Int): TokenSeries {
        val list = MutableList(n,fun(_:Int):Int{return fillerValue})
        val lastN = tokens.takeLast(n).reversed()
        var index = n
        for(ltoken in lastN){
            index--
            list[index] = ltoken
        }
        return TokenSeries(list.toTypedArray())
    }

    override fun toString():String{
        var text = "|"
        for(t in tokens){
            text += "$t|"
        }
        return text
    }

    override fun equals(other: Any?): Boolean {
        return if(other is TokenSeries){
            (this.tokens.contentEquals(other.tokens))
        }
        else false
    }

}