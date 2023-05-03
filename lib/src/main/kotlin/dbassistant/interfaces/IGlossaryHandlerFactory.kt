package dbassistant.interfaces

import dbassistant.tokenhandlers.GlossaryTokenHandler

interface IGlossaryHandlerFactory {
  fun build(priority: Int):GlossaryTokenHandler
}