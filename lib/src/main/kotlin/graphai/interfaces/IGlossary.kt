package graphai.interfaces

interface IGlossary {
    val maxId:Int
    fun getClassFromKeyword(token: String) : String?
    fun indexOf(token: String) : Int
    fun getClassFromId(id: Int): String
}