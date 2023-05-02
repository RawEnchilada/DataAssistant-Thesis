package dbassistanttest.db

import dbassistant.interfaces.Glossary
import dbassistant.interfaces.IDBConnection
import dbassistant.interfaces.IGlossaryFactory

class GlossaryFactory(
    private val db: IDBConnection
) : IGlossaryFactory {

    private val query = "SELECT name, @class FROM V WHERE @class != 'Date'"


    override fun build(): Glossary {
        db.connect()
        val result = db.query(query)
        if(result == null)throw Exception("Failed to build glossary: Query result is empty.")
        val glossary = Glossary()
        for(row in result){
            val type = row["@class"].toString()
            val key = row["name"].toString()
            val classId = glossary.addClass(type)
            glossary.addKey(key, classId)
        }
        db.disconnect()
        return glossary
    }

}