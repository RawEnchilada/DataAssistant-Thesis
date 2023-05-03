package dbassistant.tokens

import dbassistant.interfaces.IGlossaryHandlerFactory
import dbassistant.interfaces.ITokenHandler
import dbassistant.tokenhandlers.*
import dbassistant.analysis.Logging
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.ObjectInputStream
import java.io.ObjectOutputStream
import java.io.Serializable


/**
 * Class responsible for preparing the input prompt for the model
 */
class Tokenizer(
        glossaryHandlerFactory: IGlossaryHandlerFactory,
        maxArgumentCount:Int,
        maxGenericTokenCount:Int
) : Serializable{

    val endTokenHandler = EndTokenHandler(0)
    val emptyTokenHandler = EmptyTokenHandler(1)
    val argumentTokenHandler = ArgumentTokenHandler(10, maxArgumentCount)
    val genericTokenHandler = GenericTokenHandler(3, maxGenericTokenCount)
    val glossaryTokenHandler = glossaryHandlerFactory.build(2)

    private val handlers = arrayOf(
            endTokenHandler,
            emptyTokenHandler,
            argumentTokenHandler,
            genericTokenHandler,
            glossaryTokenHandler
    )


    val maxId : Int get()=(handlers.sumOf { h -> h.size })
    
    /**
     * Encodes a series of words into assigned ids,
     * returned tokens' length is fixed to the model's input size (wordMap.promptSize, filled with empty tokens '_' wherever needed)
     * @return [TokenSeries] - The encoded prompt
     */
    fun encode(input: List<String>):TokenSeries{
        val tokens = mutableListOf<Int>()
        
        for(index in input.indices){
            val word = input[index]
                   
            for (handler in handlers.sortedBy { h->h.priority }){
                if(handler.canEncode(word)){
                    val offset = handlerOffset(handler)
                    val token = handler.encode(word)
                    tokens.add(offset + token.value)
                    if(token.type == TokenType.KEY){
                        val argOffset = handlerOffset(argumentTokenHandler)
                        val argToken = argumentTokenHandler.encode(word)
                        tokens.add(argOffset + argToken.value)
                    }
                    break
                }
                else continue
            }
        }
        //Possible exception: generated tokens are longer than the input words

        return TokenSeries(tokens.toTypedArray())
    }


    /**
     * Decodes a series of assigned ids back into a readable prompt
     * @return [List<String>] - The decoded prompt
     */
    fun decode(input: TokenSeries): List<String> {
        val words = mutableListOf<String>()
        for(token in input.tokens){
            var offset = 0
            for (handler in handlers){
                if(token < offset+handler.size){
                    val word = handler.decode(token-offset)
                    words.add(word)
                    break
                }
                else{
                    offset += handler.size
                }
            }
        }
        return words
    }
    
    fun resetState(){
        handlers.forEach {
            h->h.resetState()
        }
    }
    
    fun serialize(path:String){
        throw NotImplementedError()
    }
    
    companion object{
        fun deserialize(path:String):Tokenizer{
            throw NotImplementedError()
        }
    }
    
    


    fun handlerOffset(handler: ITokenHandler):Int{
        return handlers.takeWhile { it != handler }.sumOf { it.size }
    }

}



