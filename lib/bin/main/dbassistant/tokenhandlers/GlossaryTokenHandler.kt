package dbassistant.tokenhandlers

import dbassistant.analysis.Logging
import dbassistant.exceptions.MishandledTokenException
import dbassistant.interfaces.ITokenHandler
import dbassistant.tokens.Token
import dbassistant.tokens.TokenType

class GlossaryTokenHandler(
    override val priority: Int,
    private val classList: Set<String>,
    private val keyMap: Map<String,Int>
) : ITokenHandler {


    override var mutable: Boolean = false
    
    override val size: Int
        get() = (classList.size+keyMap.keys.size)

    override fun canEncode(word: String): Boolean {
        return (classList.contains(word) || keyMap.containsKey(word))
    }

    override fun encode(word: String): Token {
        if(classList.contains(word)){
            return Token(classList.indexOf(word),TokenType.CLASS)
        }
        else if(keyMap.containsKey(word)){
            val cid = keyMap[word]!!
            return Token(cid,TokenType.KEY)
        }
        else{
            throw MishandledTokenException()
        }
    }

    override fun decode(token: Int): String {
        if (token < classList.size){
            return classList.elementAt(token)
        }
        else if (token < keyMap.keys.size){
            Logging.warningln("Returning key id from glossary, why is this needed?")
            return keyMap.keys.elementAt(token-classList.size)            
        }
        else throw MishandledTokenException()
    }
    
    override fun resetState() {}

}