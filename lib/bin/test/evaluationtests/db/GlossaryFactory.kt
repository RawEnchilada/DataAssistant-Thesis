package dbassistanttest.db

import dbassistant.interfaces.IDBConnection
import dbassistant.interfaces.IGlossaryHandlerFactory
import dbassistant.tokenhandlers.ArgumentTokenHandler
import dbassistant.tokenhandlers.GlossaryTokenHandler

class GlossaryHandlerFactory(
    private val argumentTokenHandler: ArgumentTokenHandler,
    private val db: IDBConnection
) : IGlossaryHandlerFactory {

    private val query = "SELECT name, @class FROM V WHERE @class != 'Date'"


    override fun build(priority:Int): GlossaryTokenHandler {
        db.connect()
        val result = db.query(query)
        if(result == null)throw Exception("Failed to build glossary: Query result is empty.")
        val classList = mutableSetOf<String>()
        val keymap = mutableMapOf<String,Int>()
        for(row in result){
            val type = row["@class"].toString()
            val key = row["name"].toString()
            classList.add(type)
            val classId = classList.indexOf(type)
            keymap[key]=classId
        }
        db.disconnect()
        return GlossaryTokenHandler(
            priority,
            classList.toSet(),
            keymap.toMap()
        )
    }

}