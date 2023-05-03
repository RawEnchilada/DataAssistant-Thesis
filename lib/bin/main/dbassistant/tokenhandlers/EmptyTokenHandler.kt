package dbassistant.tokenhandlers

import dbassistant.exceptions.MishandledTokenException
import dbassistant.interfaces.ITokenHandler
import dbassistant.tokens.Token
import dbassistant.tokens.TokenType

class EmptyTokenHandler(
    override val priority: Int
) : ITokenHandler{

    val emptyToken:Int = 0

    override var mutable: Boolean = false

    override val size: Int = 1
    override fun canEncode(word: String): Boolean {
        return word == "_"
    }

    override fun encode(word:String):Token{
        if(word == "_")return Token(emptyToken,TokenType.EMPTY)
        else throw MishandledTokenException()
    }
    override fun decode(token:Int):String{
        if(token == emptyToken)return "_"
        else throw MishandledTokenException()
    }

    override fun resetState() {}


}