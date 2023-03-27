package graphai.preprocessing

import graphai.interfaces.IGlossary

class WordMap(
    private val glossary: IGlossary
){

    private val maxWordCount = 5000
    private val knownWords = MutableList(maxWordCount){ "" }

    val maxId:Int
        get() = maxWordCount+glossary.maxId



    fun encode(token:String):Int{
        return if(glossary.getClassFromKeyword(token) != null){
            maxWordCount + glossary.indexOf(token)
        }
        else{
            addWord(token)
        }
    }


    /**
     * Returns true if the supplied id references a class from the database
     */
    fun isKnownClass(id: Int):Boolean{
        return (maxWordCount > id)
    }

    fun decode(id:Int):String{
        return if(id < maxWordCount){
            knownWords[id]
        }
        else{
            glossary.getClassFromId(id - maxWordCount)
        }
    }


    private fun addWord(word: String):Int{
        var firstEmpty = -1
        for (i in 0..maxWordCount){
            if(firstEmpty == -1 && knownWords[i] == ""){
                firstEmpty = i
            }
            else if(knownWords[i] == word){
                return i
            }
        }
        knownWords[firstEmpty] = word
        return firstEmpty
    }


}