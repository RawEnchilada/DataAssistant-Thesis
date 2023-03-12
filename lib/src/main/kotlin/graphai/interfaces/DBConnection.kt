package graphai.interfaces


interface DBConnection{
    fun connect()
    fun disconnect()
    fun query(query: String): Any
}