package unittests

import dbassistant.tokenhandlers.ArgumentTokenHandler
import dbassistant.tokenhandlers.EmptyTokenHandler
import dbassistant.tokenhandlers.EndTokenHandler
import dbassistant.tokenhandlers.GenericTokenHandler
import dbassistant.tokens.TokenSeries
import dbassistant.tokens.Tokenizer
import dbassistant.analysis.Logging
import org.junit.jupiter.api.BeforeEach
import unittests.mock.MockGlossaryHandlerFactory
import kotlin.test.Test
import kotlin.test.assertEquals

class TokenizerTests {

    private val maxArgumentCount = 5
    private val maxGenericTokenCount = 100
    private val promptSize = 2

    private val mockGHFactory = MockGlossaryHandlerFactory()

    var tokenizer:Tokenizer? = null

    @BeforeEach
    fun initTokenizer(){
        tokenizer = Tokenizer(
            mockGHFactory,
            promptSize,
            maxArgumentCount,
            maxGenericTokenCount
        )
    }
  
    @Test
    fun encodeEndTokenTest(){
        val token = tokenizer!!.encode(listOf("[END]"))
        val emptyId = tokenizer!!.handlerOffset(tokenizer!!.emptyTokenHandler)
        val expected = TokenSeries(arrayOf(tokenizer!!.endTokenHandler.endToken,emptyId))
        assertEquals(expected, token)
    }

    @Test
    fun decodeEndTokenTest(){
        val expected = "[END]"
        val token = tokenizer!!.encode(listOf(expected))
        val decoded = tokenizer!!.decode(token)
        assertEquals(expected, decoded.first())
    }

    @Test
    fun encodeEmptyTokenTest(){
        val token = tokenizer!!.encode(listOf("_"))
        val emptyId = tokenizer!!.handlerOffset(tokenizer!!.emptyTokenHandler)
        val expected = TokenSeries(arrayOf(emptyId,emptyId))
        assertEquals(expected, token)
    }

    @Test
    fun decodeEmptyTokenTest(){
        val expected = "_"
        val token = tokenizer!!.encode(listOf(expected))
        val decoded = tokenizer!!.decode(token)
        assertEquals(expected, decoded.first())
    }

    @Test
    fun encodeArgumentTokenTest(){
        val token = tokenizer!!.encode(listOf(mockGHFactory.getExampleKey()))
        val classId = tokenizer!!.handlerOffset(tokenizer!!.glossaryTokenHandler)
        val argId = tokenizer!!.handlerOffset(tokenizer!!.argumentTokenHandler)
        val expected = TokenSeries(arrayOf(classId,argId))
        assertEquals(expected, token)
    }

    @Test
    fun decodeArgumentTokenTest(){
        val argToken = tokenizer!!.encode(listOf(mockGHFactory.getExampleKey()))
        val decoded = tokenizer!!.decode(argToken)
        val expected = listOf(mockGHFactory.getExampleClass(),mockGHFactory.getExampleKey())
        assertEquals(expected, decoded)
    }

    @Test
    fun encodeGenericTokenTest(){
        val token = tokenizer!!.encode(listOf("generic"))
        val tokenId = tokenizer!!.handlerOffset(tokenizer!!.genericTokenHandler)
        val emptyId = tokenizer!!.handlerOffset(tokenizer!!.emptyTokenHandler)
        val expected = TokenSeries(arrayOf(tokenId,emptyId))
        assertEquals(expected,token)
    }

    @Test
    fun decodeGenericTokenTest(){
        val expected = "generic"
        val token = tokenizer!!.encode(listOf(expected))
        val decoded = tokenizer!!.decode(token)
        assertEquals(expected, decoded.first())
    }

    @Test
    fun encodeClassTokenTest(){
        val token = tokenizer!!.encode(listOf(mockGHFactory.getExampleClass()))
        val classId = tokenizer!!.handlerOffset(tokenizer!!.glossaryTokenHandler)
        val emptyId = tokenizer!!.handlerOffset(tokenizer!!.emptyTokenHandler)
        val expected = TokenSeries(arrayOf(classId,emptyId))
        assertEquals(expected,token)
    }

    @Test
    fun decodeClassTokenTest(){
        val expected = mockGHFactory.getExampleClass()
        val token = tokenizer!!.encode(listOf(expected))
        val decoded = tokenizer!!.decode(token)
        assertEquals(expected, decoded.first())
    }




    
    
}