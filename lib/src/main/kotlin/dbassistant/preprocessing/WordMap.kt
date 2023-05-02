package dbassistant.preprocessing

import dbassistant.interfaces.Glossary
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.ObjectInputStream
import java.io.ObjectOutputStream
import java.io.Serializable
import kotlin.math.log10


/**
 * A conversion class responsible for classifying input tokens and assigning id's to each of them
 * Encoding order:
 *  - endToken
 *  - arguments
 *  - learnt words
 *  - glossary
 */
class WordMap(
    /**
     * A dictionary containing the node names from the database
     */
    val glossary: Glossary,

        /**
     * Maximum count of accepted tokens by the model
     */
    val maxPromptSize:Int = 100,
        /**
     * How many last tokens are included in the input layer from the output of the model
     */
    val memorySize:Int = 25,
        /**
     * Amount of arguments the model can handle
     */
    val maxArgumentCount:Int = 10,
        /**
     * Amount of words the model can learn
     */
    val maxWordCount:Int = 500
) : Serializable{
    /**
     * Id of the end token responsible for closing a series of tokens
     */
    val endTokenId:Int = 0

    /**
     * Amount of references to data in the database
     */
    val glossaryKeyCount:Int get() = glossary.maxId
    /**
     * The highest possible id in the wordmap (not included)
     */
    val maxOverallId:Int
        get() = 1+maxArgumentCount+maxWordCount+glossaryKeyCount

    /**
     * The words that refer to a specific data in the database
     */
    private val arguments = MutableList(maxArgumentCount){ "" }
    /**
     * Every word that the model knows which doesn't have a data reference
     */
    private val knownWords = MutableList(maxWordCount){ "" }

    /**
     * Number of stored arguments
     */
    val storedArgumentCount:Int
        get() = arguments.count { i -> i != "" }


    /**
     * Flag deciding if the model can learn new words.
     */
    private var inTraining = false


    init{
        val defaultCommonWords = listOf(
            "_",
            "select",
            "where",
            "from",
            "in"
        )
        for (word in defaultCommonWords){
            addWord(word)
        }
    }

    /**
     * Clear the argument cache. Should be used before each prompt.
     */
    fun clearArguments(){
        arguments.replaceAll { _ -> "" }
    }

    /**
     * Encode a word that refers to a specific data in the database, store it for decoding
     * @return [Int] - The assigned id
     */
    fun encodeArgument(argument:String):Int{
        var firstEmpty = -1
        for (i in 0 until maxArgumentCount){
            if(firstEmpty == -1 && arguments[i] == ""){
                firstEmpty = i
            }
            else if(arguments[i] == argument){
                return i
            }
        }
        if(firstEmpty == -1)throw Exception("Argument cache is full!")
        arguments[firstEmpty] = argument
        return 1+firstEmpty
    }

    /**
     * Encode a word that isn't an argument
     * @return [Int] - The assigned id
     */
    fun encodeToken(token:String):Int{
        val glossaryId = glossary.getIdOfWord(token)
        return if(glossaryId != -1){
            1+maxArgumentCount + maxWordCount + glossaryId
        }
        else{
            1+maxArgumentCount + addWord(token)
        }
    }

    /**
     * Allows the model to learn new words
     */
    fun startTraining(){
        inTraining = true
    }

    /**
     * Disables learning new words
     */
    fun endTraining(){
        inTraining = false
    }

    /**
     * Decodes an id back into the word it's been assigned to.
     * @return [String] - The word
     */
    fun decode(id:Int):String{
        if(id == 0){
            return "\n"
        }
        else if(id < 1+maxArgumentCount){
            return arguments[id-1]
        }
        else if(id < 1+maxArgumentCount+maxWordCount){
            return knownWords[id-maxArgumentCount-1]
        }
        else{
            val word = glossary.getWordById(id-maxWordCount-maxArgumentCount-1)
            if(word != null){
                return word
            }
        }
        throw IndexOutOfBoundsException()
    }

    /**
     * Assign an id to a word if it hasn't been assigned one yet.
     * @return [Int] - The assigned id
     */
    private fun addWord(word: String):Int{
        var firstEmpty = -1
        for (i in 0 until maxWordCount){
            if(firstEmpty == -1 && knownWords[i] == ""){
                firstEmpty = i
            }
            else if(knownWords[i] == word){
                return i
            }
        }
        return if(inTraining){
            knownWords[firstEmpty] = word
            firstEmpty
        }
        else{
            maxWordCount
        }
    }
    
    
    override fun toString():String{
        var text = "Wordmap instance id: ${System.identityHashCode(this)}\n"
        text += "----|--------\n"
        for(i in 0 until knownWords.size){
            val offset = 1+maxArgumentCount+i
            val fill = (4-log10(offset.toFloat()+1)).toInt()
            text += (" ".repeat(fill) + offset)
            text += "|${knownWords[i]}\n"
        }
        text += "----|--------\n"
        return text
    }

    fun printArguments():String{
        var text = "Wordmap instance id: ${System.identityHashCode(this)}\n"
        text += "----|--------\n"
        for(i in 0 until arguments.size){
            val offset = 1+i
            val fill = (4-log10(offset.toFloat()+1)).toInt()
            text += (" ".repeat(fill) + offset)
            text += "|${arguments[i]}\n"
        }
        text += "----|--------\n"
        return text
    }

    fun serialize(path:String){
        ObjectOutputStream(FileOutputStream(path)).use { out ->
            out.writeObject(maxPromptSize)
            out.writeObject(memorySize)
            out.writeObject(endTokenId)
            out.writeObject(maxArgumentCount)
            out.writeObject(maxWordCount)
            out.writeObject(glossaryKeyCount)
            out.writeObject(maxOverallId)
            out.writeObject(storedArgumentCount)
            out.writeObject(arguments)
            out.writeObject(knownWords)
            out.writeObject(glossary)
        }
    }
    
    companion object{
        fun deserialize(path:String):WordMap{
            ObjectInputStream(FileInputStream(path)).use { input ->
                val maxPromptSize = input.readObject() as Int
                val memorySize = input.readObject() as Int
                val endTokenId = input.readObject() as Int
                val maxArgumentCount = input.readObject() as Int
                val maxWordCount = input.readObject() as Int
                val glossaryKeyCount = input.readObject() as Int
                val maxId = input.readObject() as Int
                val storedArgumentCount = input.readObject() as Int
                val arguments = input.readObject() as MutableList<String>
                val knownWords = input.readObject() as MutableList<String>
                val glossary = input.readObject() as Glossary
                return WordMap(
                        glossary,
                        maxPromptSize,
                        memorySize,
                        maxArgumentCount,
                        maxWordCount
                    ).apply {
                        this.arguments.clear()
                        this.arguments.addAll(arguments)
                        this.knownWords.clear()
                        this.knownWords.addAll(knownWords)
                    }
            }
        }
    }

}