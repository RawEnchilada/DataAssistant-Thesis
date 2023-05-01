package unittests

import dbassistant.preprocessing.WordMap
import org.junit.jupiter.api.BeforeEach
import unittests.mock.MockGlossary
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals

class WordMapTests {
    
    private val maxArgumentCount = 5
    private val maxWordCount = 10
    private val maxPromptSize = 10
    private val memorySize = 5
    
    private val glossary = MockGlossary()
    private var wordmap: WordMap = WordMap(glossary,maxPromptSize,memorySize,maxArgumentCount,maxWordCount)
    
    private val tmpFolderPath get() = "/tmp/dbassistant-unittest"
    private val wordmapFilePath get() = "$tmpFolderPath/word.map"
    
    @BeforeEach
    fun initWordMap(){
        wordmap = WordMap(glossary,maxPromptSize,memorySize,maxArgumentCount,maxWordCount)
        wordmap.startTraining() // allow learning
    }
    
    
    @Test
    fun encodeArgumentsTest(){
        val token = wordmap.encodeArgument("test")
        assertEquals(1,token)
    }
    
    @Test
    fun decodeArgumentsTest(){
        val token = wordmap.encodeArgument("test")
        val decoded = wordmap.decode(token)
        assertEquals("test",decoded)
    }
    
    
    @Test
    fun clearArgumentsTest(){
        val token = wordmap.encodeArgument("test")
        wordmap.clearArguments()
        val decoded = wordmap.decode(token)
        assertEquals("",decoded)        
    }
    
    @Test
    fun encodeWordTokenTest(){
        val token = wordmap.encodeToken("test")
        val expected = 1+maxArgumentCount
        assertEquals(expected,token)        
    }
    
    @Test
    fun decodeWordTokenTest(){
        val token = wordmap.encodeToken("test")
        val decoded = wordmap.decode(token)
        assertEquals("test",decoded)
    }
    
    @Test
    fun encodeGlossaryTokenTest(){
        val token = wordmap.encodeToken(glossary.getExampleKey())
        val expected = 1+maxArgumentCount+maxWordCount
        assertEquals(expected,token)
    }
    
    @Test
    fun decodeGlossaryTokenTest(){
        val token = wordmap.encodeToken(glossary.getExampleKey())
        val decoded = wordmap.decode(token)
        assertEquals(glossary.getExampleValue(),decoded)
    }
    
    @Test
    fun wordMapSerialization(){
        val directory = File(tmpFolderPath)
        if (!directory.exists()) {
            directory.mkdirs()
        }
        val argToken = wordmap.encodeArgument("argument")
        val wordToken = wordmap.encodeToken("word")
        wordmap.serialize(wordmapFilePath)
        val deserialized = WordMap.deserialize(wordmapFilePath)
        val decodedArg = deserialized.decode(argToken)
        val decodedWord = deserialized.decode(wordToken)
        
        assertEquals("argument",decodedArg)
        assertEquals("word",decodedWord)
    }
    
    
}