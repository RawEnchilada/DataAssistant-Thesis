package dbassistant.preprocessing

import dbassistant.interfaces.IGlossary
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.ObjectInputStream
import java.io.ObjectOutputStream
import java.io.Serializable
import java.util.*
import kotlin.math.log10


/**
 * A conversion class responsible for classifying input tokens and assigning id's to each of them
 */
class WordMap(
    private val glossary: IGlossary,

    /**
     * Maximum count of accepted tokens by the model
     */
    val maxPromptSize:Int = 100,
    /**
     * How many last tokens are included in the input layer from the output of the model
     */
    val memorySize:Int = 25,


    /**
     * Id of the end token responsible for closing a series of tokens
     */
    val endTokenId:Int = 0,
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
     * Amount of references to data in the database
     */
    val glossaryKeyCount:Int get() = glossary.maxId
    /**
     * The highest possible id in the wordmap (not included)
     */
    val maxId:Int
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
        return if(glossary.getClassFromKeyword(token) != null){
            1+maxArgumentCount + maxWordCount + glossary.indexOf(token)
        }
        else{
            1+maxArgumentCount + addWord(token.lowercase(Locale.getDefault()))
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
     * @return [Boolean] - true if the supplied id references a class from the database
     */
    fun isKnownClass(id: Int):Boolean{
        return (id > (maxArgumentCount+maxWordCount))
    }

    /**
     * Decodes an id back into the word it's been assigned to.
     * @return [String] - The word
     */
    fun decode(id:Int):String{
        return if(id == 0){
            "\n"
        }
        else if(id < maxArgumentCount){
            arguments[id-1]
        }
        else if(id < maxWordCount){
            knownWords[id-maxArgumentCount-1]
        }
        else{
            glossary.getClassFromId(id - maxWordCount - maxArgumentCount - 1)
        }
        //TODO handle too large id
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
        var text = "\n----|--------\n"
        text += "${System.identityHashCode(this)}\n"
        for(i in 0 until knownWords.size){
            val offset = i+1+maxArgumentCount
            val fill = (4-log10(offset.toFloat())).toInt()
            text += (" ".repeat(fill) + offset)
            text += "|${knownWords[i]}\n"
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
            out.writeObject(maxId)
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
                val glossary = input.readObject() as IGlossary
                return WordMap(
                        glossary,
                        maxPromptSize,
                        memorySize,
                        endTokenId,
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