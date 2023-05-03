package dbassistant.tokenhandlers

import dbassistant.exceptions.ArgumentHandlerIsFullException
import dbassistant.exceptions.MishandledTokenException
import dbassistant.interfaces.ITokenHandler
import dbassistant.tokens.Token
import dbassistant.tokens.TokenType

class ArgumentTokenHandler(
    override val priority: Int,
    maxArgumentCount:Int
) : ITokenHandler {
    
    private val arguments = MutableList(maxArgumentCount){""}
    
    override val size: Int get() = arguments.size

    /**
     * Ignored in this handler because arguments are unique to each prompt evaluation
     */
    override var mutable: Boolean = true

    override fun canEncode(word: String): Boolean {
        return arguments.contains(word)
    }
    
    override fun encode(word: String): Token {
        var index = arguments.indexOf(word)
        if(index == -1){
            index = store(word)
        }
        return Token(index,TokenType.ARGUMENT)
    }

    override fun decode(token: Int): String {
        try{
            val word = arguments.elementAt(token)
            return word
        }
        catch (e:IndexOutOfBoundsException){
            throw MishandledTokenException()
        }
    }

    private fun store(arg:String):Int{
        val index = arguments.indexOfFirst { a->a=="" }
        if(index == -1)throw ArgumentHandlerIsFullException()
        arguments[index] = arg
        return index
    }
    
    override fun resetState(){
        for(index in arguments.indices){
            arguments[index] = ""
        }
    }
}