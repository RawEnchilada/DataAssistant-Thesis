package unittests.mock

import dbassistant.interfaces.Glossary
import dbassistant.interfaces.IGlossaryFactory

class MockGlossaryFactory : IGlossaryFactory {

    override fun build(): Glossary {
        val glossary = Glossary()
        val id = glossary.addClass(getExampleClass())
        glossary.addKey(getExampleKey(),id)
        return glossary
    }
    
    fun getExampleKey():String{
        return "ExampleKey"
    }
    
    fun getExampleClass():String{
        return "ExampleNode"
    }


}