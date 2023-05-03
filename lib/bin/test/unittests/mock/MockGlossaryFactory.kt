package unittests.mock

import dbassistant.interfaces.IGlossaryHandlerFactory
import dbassistant.tokenhandlers.ArgumentTokenHandler
import dbassistant.tokenhandlers.GlossaryTokenHandler

class MockGlossaryHandlerFactory : IGlossaryHandlerFactory {

    override fun build(priority:Int): GlossaryTokenHandler {
        val glossary = GlossaryTokenHandler(
            priority,
            setOf(getExampleClass()),
            mapOf(Pair(getExampleKey(),0))
        )
        return glossary
    }
    
    fun getExampleKey():String{
        return "ExampleKey"
    }
    
    fun getExampleClass():String{
        return "ExampleClass"
    }


}