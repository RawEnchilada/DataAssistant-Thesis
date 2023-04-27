package dbassistant.db

import dbassistant.interfaces.IDBConnection
import dbassistant.interfaces.IGlossary

class Glossary(
    db: IDBConnection
) : IGlossary {

    private val query = "SELECT name, @class FROM V WHERE @class != 'Date'"
    private var dictionary: MutableMap<String,String> = mutableMapOf()

    init{
        db.connect()
        val result = db.query(query)
        if(result == null)throw Exception("Failed to build glossary: Query result is empty.")
        dictionary.clear()
        for(row in result){
            val type = row["@class"].toString()
            val key = row["name"].toString()
            if(dictionary.containsKey(key)){
                throw Exception("Key already present in glossary! Please make sure your query only contains unique keys!")
            }
            dictionary[key] = type
        }
        db.disconnect()
    }

    override val maxId: Int
        get() = dictionary.size

    override fun getClassFromId(id: Int): String {
        return dictionary.values.elementAt(id)
    }

    override fun getClassFromKeyword(token: String): String? {
        return if(dictionary.containsKey(token)){
            dictionary[token]
        }
        else{
            null
        }
    }

    override fun indexOf(token: String): Int {
        return dictionary.keys.indexOf(token)
    }


}