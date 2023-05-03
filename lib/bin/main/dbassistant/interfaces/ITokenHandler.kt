package dbassistant.interfaces

import dbassistant.exceptions.MishandledTokenException
import dbassistant.tokens.Token

interface ITokenHandler {
    /**
     * Determines the order of which handlers get to encode the given token.
     * 0 comes first
     */
    val priority: Int
    
    /**
     * Determines the highest possible id that a handler can return
     */
    val size: Int

    /**
     * Determines if the Handler can be modified, will be set to false after training or loading
     */
    var mutable: Boolean
    
    /**
     * @return [Boolean] - True if the handler can accept the word
     */
    fun canEncode(word: String):Boolean
    
    /**
     * Try to encode a word into a token
     * @return [Array<Int>] - The encoded token id's, only special handlers return more than one token
     */
    fun encode(word:String): Token
    
    /**
     * Try to decode a token into a word
     * @return [Int] - The decoded word
     * @throws [MishandledTokenException] - When a token cannot be decoded by this handler
     */
    fun decode(token:Int):String
    
    fun resetState()
}