from abc import ABC, abstractmethod

class ITokenHandler(ABC):
    """
    Determines the order of which handlers get to encode the given token.
    0 comes first
    """
    @property
    @abstractmethod
    def priority(self):
        pass
    
    """
    Determines the highest possible id that a handler can return
    """
    @property
    @abstractmethod
    def size(self):
        pass

    """
    Determines the amount of id's that are actually used by the handler
    """
    @property
    @abstractmethod
    def utilizedSize(self):
        pass

    """
    Determines if the Handler can be modified, will be set to false after training or loading
    """
    @property
    @abstractmethod
    def mutable(self):
        pass

    @mutable.setter
    @abstractmethod
    def mutable(self, value):
        pass

    """
    Returns True if the handler can accept the word
    """
    @abstractmethod
    def canEncode(self, word):
        pass

    """
    Try to encode a word into a token
    Returns the encoded token id's, only special handlers return more than one token
    """
    @abstractmethod
    def encode(self, word):
        pass

    """
    Try to decode a token into a word
    Returns the decoded word
    Raises MishandledTokenException when a token cannot be decoded by this handler
    """
    @abstractmethod
    def decode(self, token):
        pass

    @abstractmethod
    def resetState(self):
        pass


    @abstractmethod
    def serialize(self, path):
        pass

    @abstractmethod
    def deserialize(self, path):
        pass