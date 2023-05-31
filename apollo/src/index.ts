import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServer } from "@apollo/server";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";
dotenv.config();


const typeDefs = `#graphql
  # Person class

    type Person {
        name: String!
        birthday: String!
        neptun: String!
        email: String!
        specializesIn: Specialization @cypher(statement: "MATCH (this)-[:specializesIn]->(s:Specialization) RETURN s", columnName: "s")
        studies: Degree @cypher(statement: "MATCH (this)-[:studies]->(d:Degree) RETURN d")
    }

    type Faculty {
        name: String!
        hasDegree: [Degree!] @cypher(statement: "MATCH (this)-[:hasDegree]->(d:Degree) RETURN d")
        hasDepartment: [Department!]! @relationship(type: "hasDepartment", direction: OUT)
    }

    type Department {
        name: String!
        hasSpecialization: [Specialization!] @cypher(statement: "MATCH (this)-[:hasSpecialization]->(s:Specialization) RETURN s", columnName: "s")
    }

    type Degree {
        name: String!
        level: String!
        hasSpecialization: [Specialization!] @cypher(statement: "MATCH (this)-[:hasSpecialization]->(s:Specialization) RETURN s", columnName: "s")
        hasCourse: [Course!]! @relationship(type: "hasCourse", direction: OUT)
    }

    type Specialization {
        name: String!
    }

    type Building {
        name: String!
    }

    type Room {
        name: String!
        isIn: Building! @relationship(type: "isIn", direction: OUT)
    }

    type Course {
        name: String!
        code: String!
        credit: Int!
        semester: Int!
        description: String!
        language: String!
        prerequisite: [Course!] @cypher(statement: "MATCH (this)-[:prerequisite]->(c:Course) RETURN c", columnName: "c")
        hasLesson: [Lesson!] @cypher(statement: "MATCH (this)-[:hasLesson]->(l:Lesson) RETURN l", columnName: "l")
        hasHomework: [Homework!] @cypher(statement: "MATCH (this)-[:hasHomework]->(h:Homework) RETURN h", columnName: "h")
        hasExam: [Exam!] @cypher(statement: "MATCH (this)-[:hasExam]->(e:Exam) RETURN e", columnName: "e")
    }

    type Lesson {
        name: String!
        type: String!
        day: String!
        start: String!
        end: String!
        recurring: String!
        isIn: Room! @relationship(type: "isIn", direction: OUT)
    }

    type Homework {
        name: String!
        deadline: String!
        description: String!
        required: Boolean!
    }

    type Exam {
        name: String!
        date: String!
        type: String!
        duration: String!
        isIn: Room! @relationship(type: "isIn", direction: OUT)
    }

`;

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );
  
  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
  
  neoSchema.getSchema().then(async (schema) => {
      const server = new ApolloServer({
          schema: schema
      });
  
      const { url } = await startStandaloneServer(server, {
        listen: { port: 4000 },
      });
      
      
      console.log(`🚀  Server ready at: ${url}`);
  });