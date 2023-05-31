from dbassistant.interfaces.IDBConnection import IDBConnection
from dbassistant.interfaces.IGlossaryHandlerFactory import IGlossaryHandlerFactory
from dbassistant.tokenhandlers.GlossaryTokenHandler import GlossaryTokenHandler


class OrientGlossaryHandlerFactory(IGlossaryHandlerFactory):
    def __init__(self, db: IDBConnection):
        self.db = db
        self.query = "SELECT name, @class FROM V WHERE @class != 'Date'"

    def build(self, priority: int) -> GlossaryTokenHandler:
        self.db.connect()
        result = self.db.query(self.query)
        if result is None:
            raise Exception("Failed to build glossary: Query result is empty.")
        classList = set()
        keymap = {}
        for row in result:
            if 'class' not in row:
                continue
            _type = str(row['class'])
            classList.add(_type)


        for row in result:
            if 'name' not in row or 'class' not in row:
                continue
            _type = str(row['class'])
            key = str(row['name'])

            classId = -1
            for _class in classList:
                if _class == _type:
                    classId += 1
                    break
                classId += 1

            if classId == -1:
                raise Exception("Failed to build glossary: Class not found in classList.")

            keymap[key] = classId

        self.db.disconnect()
        return GlossaryTokenHandler(priority, classList, keymap)


class ApolloGlossaryHandlerFactory(IGlossaryHandlerFactory):
    def __init__(self, db: IDBConnection):
        self.db = db
        

    def build(self, priority: int) -> GlossaryTokenHandler:
        keymap = {}
        classList = set([
            "Person",
            "Faculty",
            "Department",
            "Course",
            "Room",
            "Building",
            "Lesson",
            "Exam",
            "Homework",
            "Specilization",
            "Degree"
        ])

        people = self.db.query("people{name}")['data']['people']
        faculties = self.db.query("faculties{name}")['data']['faculties']
        departments = self.db.query("departments{name}")['data']['departments']
        courses = self.db.query("courses{name}")['data']['courses']
        rooms = self.db.query("rooms{name}")['data']['rooms']
        buildings = self.db.query("buildings{name}")['data']['buildings']
        lessons = self.db.query("lessons{name}")['data']['lessons']
        exams = self.db.query("exams{name}")['data']['exams']
        homeworks = self.db.query("homework{name}")['data']['homework']
        specilizations = self.db.query("specializations{name}")['data']['specializations']
        degrees = self.db.query("degrees{name}")['data']['degrees']

        for person in people:
            keymap[person['name']] = 0
        for faculty in faculties:
            keymap[faculty['name']] = 1
        for department in departments:
            keymap[department['name']] = 2
        for course in courses:
            keymap[course['name']] = 3
        for room in rooms:
            keymap[room['name']] = 4
        for building in buildings:
            keymap[building['name']] = 5
        for lesson in lessons:
            keymap[lesson['name']] = 6
        for exam in exams:
            keymap[exam['name']] = 7
        for homework in homeworks:
            keymap[homework['name']] = 8
        for specilization in specilizations:
            keymap[specilization['name']] = 9
        for degree in degrees:
            keymap[degree['name']] = 10


        return GlossaryTokenHandler(priority, classList, keymap)
        