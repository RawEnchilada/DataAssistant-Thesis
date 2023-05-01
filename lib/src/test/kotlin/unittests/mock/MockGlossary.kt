package unittests.mock

import dbassistant.interfaces.IGlossary

class MockGlossary : IGlossary {
    override val maxId: Int
        get() = 1

    override fun getClassFromKeyword(token: String): String? {
        return if(token == getExampleKey()){
            getExampleValue()
        }
        else null
    }

    override fun indexOf(token: String): Int {
        return if(token == getExampleKey()){
            0
        }
        else -1
    }

    override fun getClassFromId(id: Int): String {
        if(id == 0)return getExampleValue()
        else throw IndexOutOfBoundsException()
    }
    
    fun getExampleKey():String{
        return "ExampleKey"
    }
    
    fun getExampleValue():String{
        return "ExampleNode"
    }


}