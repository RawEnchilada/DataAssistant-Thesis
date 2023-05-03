package dbassistant.analysis

import java.io.File
import java.nio.file.Paths
import java.text.SimpleDateFormat
import java.util.*

object Logging {
    private val currentDir = Paths.get("").toAbsolutePath().toString()
    val path: String =  currentDir+"/logs/log.txt"
    var writeLogs:Boolean = true
    private var file: File? = null
    

    fun println(){
        appendln("")
    }

    fun println(text:String){
        val sdf = SimpleDateFormat("dd/M/yyyy hh:mm:ss")
        val currentDate = sdf.format(Date())
        appendln("[${currentDate}] Info : $text")
    }

    fun warningln(text: String){
        val sdf = SimpleDateFormat("dd/M/yyyy hh:mm:ss")
        val currentDate = sdf.format(Date())
        appendln("[${currentDate}] Warning : $text")
    }



    private fun appendln(text: String){
        if(!writeLogs)return
        if(file == null){
            file = File(path)
            if(file!!.exists()){
                file!!.delete()
            }
            file!!.createNewFile()            
        }
        file!!.appendText("$text\n")
    }
}