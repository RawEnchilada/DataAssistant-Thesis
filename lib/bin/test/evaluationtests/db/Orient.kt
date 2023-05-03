package dbassistanttest.db


import com.beust.klaxon.Klaxon
import com.orientechnologies.orient.core.db.OrientDB
import com.orientechnologies.orient.core.db.OrientDBConfig
import com.orientechnologies.orient.core.db.OrientDBConfigBuilder
import com.orientechnologies.orient.core.db.document.ODatabaseDocument
import dbassistant.interfaces.IDBConnection

class Orient(
    val config: DBConfig
) : IDBConnection {

    private var orientDB: OrientDB? = null
    private var dbdoc: ODatabaseDocument? = null
    private val orientConfig: OrientDBConfig

    init{
        orientConfig = OrientDBConfigBuilder().build()        
    }

    override fun connect() {
        if(dbdoc == null || orientDB == null){
            orientDB = OrientDB(config.url, orientConfig)
            dbdoc = orientDB!!.open(config.db,config.user, config.password)
        }
    }

    override fun disconnect() {
        if(dbdoc != null){
            dbdoc!!.close()
            orientDB!!.close()
            dbdoc = null
            orientDB = null
        }
    }

    override fun query(query: String): List<Map<String,Any>>? {
        //SQL injection is absolutely possible, do not use in production
        //also parsing to json and back is very inefficient, but simple enough for the test
        if(dbdoc != null){
            val result = dbdoc!!.query(query)
            val set = mutableListOf<Map<String,Any>>()
            for (row in result){
                val map = Klaxon().parse<Map<String,Any>>(row.toJSON())
                if(map == null)throw Exception("Couldn't parse query result!")
                set.add(map)
            }
            return set
        }
        else{
            return null
        }
    }

}