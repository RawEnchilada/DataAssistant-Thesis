from dbassistant.analysis.Logging import Logging
from dbassistant.exceptions.ArgumentHandlerIsFullException import ArgumentHandlerIsFullException
from dbassistant.exceptions.MishandledTokenException import MishandledTokenException
from dbassistant.interfaces.ITokenHandler import ITokenHandler
from dbassistant.tokens.Token import Token
from dbassistant.tokens.TokenType import TokenType

class GlossaryTokenHandler(ITokenHandler):
    def __init__(self, priority, classList, keyMap):
        self._priority = priority
        self.classList = classList # unique set of words
        self.keyMap = keyMap #with spaces

        # keymap with spaces replaced by underscores
        self.tokenMap = {}
        for key in keyMap.copy().keys():
            self.tokenMap[key.replace(" ", "_")] = self.keyMap[key]
    
    @property
    def priority(self):
        return self._priority
    
    @priority.setter
    def priority(self, value):
        self._priority = value

    @property
    def size(self):
        return len(self.classList) + len(self.keyMap.keys())
    
    @property
    def utilizedSize(self):
        return self.size
    
    @property
    def keyCount(self):
        return len(self.keyMap.keys())
    
    @property
    def mutable(self):
        return False
    

    #Encode with token map, because tokens must not contain spaces
    def canEncode(self, word):
        return word in self.classList or word in list(self.tokenMap)
    
    def encode(self, word):
        if word in self.classList:
            classListIndex = 0
            for _class in self.classList:
                if _class == word:
                    break
                classListIndex += 1
            return Token(classListIndex, TokenType.CLASS)
        elif word in list(self.tokenMap):
            cid = self.tokenMap[word]
            return Token(cid, TokenType.KEY)
        else:
            raise MishandledTokenException()
    
    #Decode with key map, because output should be humanly readable
    def decode(self, token):
        if token < len(self.classList):
            return list(self.classList)[token]
        elif token < len(self.classList) + len(self.keyMap.keys()):
            return list(self.keyMap.keys())[token - len(self.classList)]
        else:
            raise MishandledTokenException()
    
    def resetState(self):
        pass

    def serialize(self, path):
        file = path + "/glossary_tokens.layer"
        with open(file, "w") as f:
            f.write("GlossaryTokenHandler\n")
            f.write("{}\n".format(len(self.classList)))
            for _class in self.classList:
                f.write("{}\n".format(_class))
            f.write("{}\n".format(len(self.keyMap.keys())))
            for key in self.keyMap.keys():
                f.write("{}\n".format(key))
                f.write("{}\n".format(self.keyMap[key]))

    def deserialize(self,path):
        file = path + "/glossary_tokens.layer"
        with open(file, "r") as f:
            line = f.readline().strip()
            if line != "GlossaryTokenHandler":
                raise Exception("Wrong token handler type")
            classListSize = int(f.readline().strip())
            for _ in range(classListSize):
                _class = f.readline().strip()
                self.classList.add(_class)
            keyMapSize = int(f.readline().strip())
            for _ in range(keyMapSize):
                key = f.readline().strip()
                cid = int(f.readline().strip())
                self.keyMap[key] = cid
                self.tokenMap[key.replace(" ", "_")] = cid
        