package dbassistant.tokenhandlers

import dbassistant.exceptions.MishandledTokenException
import dbassistant.interfaces.ITokenHandler
import dbassistant.tokens.Token
import dbassistant.tokens.TokenType

class EndTokenHandler(
    override val priority: Int
) : ITokenHandler{
    
    val endToken:Int = 0
    
    override val size: Int = 1

    override var mutable: Boolean = false

    override fun canEncode(word: String): Boolean {
        return word == "[END]"
    }

    override fun encode(word:String):Token{
        if(word == "[END]")return Token(endToken,TokenType.END)
        else throw MishandledTokenException()
    }
    override fun decode(token:Int):String{
        if(token == endToken)return "[END]"
        else throw MishandledTokenException()
    }

    override fun resetState() {}


}