import { GlossaryTokenHandler, IDBConnection, IGlossaryHandlerFactory } from 'data-assistant';

export default class ApolloGlossaryHandlerFactory implements IGlossaryHandlerFactory {
    private db: IDBConnection;

    constructor(db: IDBConnection) {
        this.db = db;
    }

    async build(priority: number): Promise<GlossaryTokenHandler> {
        const keymap: Map<string,number> = new Map<string,number>();
        const classList: Set<string> = new Set([
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
        ]);
        const people = (await this.db.query("people{name}"))['data']['people'];
        const faculties = (await this.db.query("faculties{name}"))['data']['faculties'];
        const departments = (await this.db.query("departments{name}"))['data']['departments'];
        const courses = (await this.db.query("courses{name}"))['data']['courses'];
        const rooms = (await this.db.query("rooms{name}"))['data']['rooms'];
        const buildings = (await this.db.query("buildings{name}"))['data']['buildings'];
        const lessons = (await this.db.query("lessons{name}"))['data']['lessons'];
        const exams = (await this.db.query("exams{name}"))['data']['exams'];
        const homeworks = (await this.db.query("homework{name}"))['data']['homework'];
        const specilizations = (await this.db.query("specializations{name}"))['data']['specializations'];
        const degrees = (await this.db.query("degrees{name}"))['data']['degrees'];

        for (const person of people) {
            keymap[person['name']] = 0;
        }
        for (const faculty of faculties) {
            keymap[faculty['name']] = 1;
        }
        for (const department of departments) {
            keymap[department['name']] = 2;
        }
        for (const course of courses) {
            keymap[course['name']] = 3;
        }
        for (const room of rooms) {
            keymap[room['name']] = 4;
        }
        for (const building of buildings) {
            keymap[building['name']] = 5;
        }
        for (const lesson of lessons) {
            keymap[lesson['name']] = 6;
        }
        for (const exam of exams) {
            keymap[exam['name']] = 7;
        }
        for (const homework of homeworks) {
            keymap[homework['name']] = 8;
        }
        for (const specialization of specilizations) {
            keymap[specialization['name']] = 9;
        }
        for (const degree of degrees) {
            keymap[degree['name']] = 10;
        }

        return new GlossaryTokenHandler(priority, classList, keymap);
    }
}
