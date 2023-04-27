/*
 * This Kotlin source file was generated by the Gradle 'init' task.
 */
package dbassistant

import dbassistant.analysis.Logging
import dbassistant.db.DBConfig
import dbassistant.db.Glossary
import dbassistant.db.Orient
import java.io.File
import java.nio.file.Paths
import kotlin.test.Test
import kotlin.test.assertEquals

class DBAssistantTest {

    private val config:DBConfig = DBConfig("remote:localhost","peopledb","root","root")
    private val db: Orient = Orient(config)
    private val glossary:Glossary = Glossary(db)
    private val ai: DBAssistant = DBAssistant(db,glossary,50,10,10,300)

    private val currentDir = Paths.get("").toAbsolutePath().toString()
    private val modelPath = currentDir+"/model"
    private val trainingDataPath = currentDir+"/model/training_data.csv"

    init{
        val model = File(modelPath+"/layers")
        if(model.exists()){
            ai.loadModel(modelPath)
        }
        else{
            ai.trainOn(trainingDataPath)
            ai.saveModel(modelPath)
        }
    }

    //"Who works at BadCompany?";"SELECT name FROM Person WHERE out('employment').name = 'BadCompany'"
    @Test
    fun WhoWorksAtBadCompany(){
        val query = ai.semanticLayer.pass("Who works at BadCompany?")
        assertEquals("SELECT name FROM Person WHERE out('employment').name = 'BadCompany'",query)
    }
    
    //"Who is Alice's spouse?";"SELECT name FROM Person WHERE @rid IN (SELECT in('spouse').@rid FROM Person WHERE name = 'Alice')"
    @Test
    fun WhoIsAlicesSpouse(){
        val query = ai.semanticLayer.pass("Who is Alice's spouse?")
        assertEquals("SELECT name FROM Person WHERE @rid IN (SELECT in('spouse').@rid FROM Person WHERE name = 'Alice')",query)
    }

}
