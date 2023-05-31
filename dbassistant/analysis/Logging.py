import os
from datetime import datetime

class Logging:
    currentDir = os.path.abspath('')
    path = os.path.join(currentDir, 'logs', 'log.txt')
    writeLogs = True
    file = None

    @staticmethod
    def setPath(path):
        Logging.currentDir = path
        Logging.path = os.path.join(path, 'logs', 'log.txt')

    @staticmethod
    def println():
        Logging.appendln("")

    @staticmethod
    def println(text):
        current_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        Logging.appendln("[{}] Info : {}".format(current_date, text))

    @staticmethod
    def warningln(text):
        current_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        Logging.appendln("[{}] Warning : {}".format(current_date, text))

    @staticmethod
    def disable():
        Logging.writeLogs = False

    @staticmethod
    def enable():
        Logging.writeLogs = True

    @staticmethod
    def appendln(text):
        if not Logging.writeLogs:
            return
        if Logging.file is None:
            Logging.file = open(Logging.path, 'w')
            Logging.file.close()
        with open(Logging.path, 'a') as file:
            file.write("{}\n".format(text))
