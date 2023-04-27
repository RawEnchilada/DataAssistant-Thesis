package dbassistant.interfaces

import java.io.Serializable

interface IGlossary : Serializable {
    val maxId:Int
    fun getClassFromKeyword(token: String) : String?
    fun indexOf(token: String) : Int
    fun getClassFromId(id: Int): String
}