package dbassistant.interfaces


interface IDBConnection{
    fun connect()
    fun disconnect()
    fun query(query: String): List<Map<String, Any>>?
}