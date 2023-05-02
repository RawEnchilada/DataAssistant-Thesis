package dbassistant.interfaces

import java.io.Serializable
import java.lang.Exception
import kotlin.math.log10

class Glossary : Serializable {

    protected var classList: MutableSet<String> = mutableSetOf()

    protected var keyMap: MutableMap<String,Int> = mutableMapOf()

    val maxId:Int get() = (classList.size+keyMap.keys.size)

    fun addClass(className:String):Int{
        classList.add(className)
        return classList.indexOf(className)
    }
    fun addKey(word:String,classId:Int):Int{
        if(classId < classList.size){
            keyMap.put(word,classId)
            return keyMap.keys.indexOf(word)
        }
        else{
            throw UnknownClassException()
        }
    }
    
    /**
     * @return [Boolean] - true if the id belongs to a class
     */
    fun isClass(id:Int):Boolean{
        return (id < classList.size)
    }
    
    /**
     * @return [Boolean] - true if the id belong to a key
     */
    fun isKey(id:Int):Boolean{
        return (classList.size <= id && id < (classList.size+keyMap.keys.size))
    }
    
    /**
     * Finds the appropriate id of the given word if it's either a key or a class
     * @return [Int] - id of the word, or -1 if it's absent from the glossary
     */
    fun getIdOfWord(word:String):Int{
        return if(classList.contains(word)){
            classList.indexOf(word)
        }
        else if(keyMap.keys.contains(word)){
            classList.size+keyMap.keys.indexOf(word)
        }
        else -1
    }

    /**
     * Finds the appropriate word of the given id if it exists in the glossary
     * @return [String] - the word, or null if the id is out of bounds
     */
    fun getWordById(id:Int):String?{
        return if(id < classList.size){
            classList.elementAt(id)
        }
        else if(id < classList.size+keyMap.keys.size){
            keyMap.keys.elementAt(id-classList.size)
        }
        else null
    }

    fun toString(offset:Int): String {
        var text = "Glossary instance id: ${System.identityHashCode(this)}\n"
        text += "----|--------\n"
        for(i in 0 until classList.size){
            val offs = offset+i
            val fill = (4-log10(offs.toFloat()+1)).toInt()
            text += (" ".repeat(fill) + offs)
            text += "|${classList.elementAt(i)}\n"
        }
        for(i in 0 until keyMap.keys.size){
            val offs = offset+i
            val fill = (4-log10(offs.toFloat()+1)).toInt()
            text += (" ".repeat(fill) + offs)
            text += "|${keyMap.keys.elementAt(i)}\n"
        }
        text += "----|--------\n"
        return text
    }
}

class UnknownClassException : Exception()