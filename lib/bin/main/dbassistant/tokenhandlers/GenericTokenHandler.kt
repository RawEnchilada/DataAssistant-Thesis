package dbassistant.tokenhandlers

import dbassistant.exceptions.ImmutableHandlerException
import dbassistant.exceptions.MishandledTokenException
import dbassistant.interfaces.ITokenHandler
import dbassistant.tokens.Token
import dbassistant.tokens.TokenType

class GenericTokenHandler(
    override val priority: Int,
    maxGenericTokenCount: Int
) : ITokenHandler{
    
    private val words = MutableList(maxGenericTokenCount){""}
    
    override val size: Int get() = words.size

    override var mutable: Boolean = true

    override fun canEncode(word: String): Boolean {
        return true
    }
    
    override fun encode(word: String): Token {
        val index = words.indexOf(word)
        if(index == -1){
            if(mutable){
                val id = words.indexOfFirst { w -> w == "" }
                words[id] = word
                return Token(id,TokenType.GENERIC)
            }
            else{
                throw ImmutableHandlerException()
            }
        }
        return Token(index,TokenType.GENERIC)
    }

    override fun decode(token: Int): String {
        try{
            val word = words.elementAt(token)
            return word
        }
        catch (e:IndexOutOfBoundsException){
            throw MishandledTokenException()
        }
    }
    
    override fun resetState() {}

}