plugins {
    // Apply the org.jetbrains.kotlin.jvm Plug.in to add support for Kotlin.
    id("org.jetbrains.kotlin.jvm") version "1.8.10"

    // Apply the java-library plugin for API and implementation separation.
    `java-library`
}

repositories {
    // Use Maven Central for resolving dependencies.
    mavenCentral()
}

dependencies {
    // Use the Kotlin JUnit 5 integration.
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")

    // Use the JUnit 5 integration.
    testImplementation("org.junit.jupiter:junit-jupiter-engine:5.9.1")

    testImplementation("com.orientechnologies:orientdb-client:3.2.17")

    // This dependency is exported to consumers, that is to say found on their compile classpath.
    api("org.apache.commons:commons-math3:3.6.1")

    // This dependency is used internally, and not exposed to consumers otensorflown their own compile classpath.
    implementation("com.google.guava:guava:31.1-jre")

    implementation ("org.jetbrains.kotlinx:kotlin-deeplearning-tensorflow:0.5.1")
    implementation ("org.jetbrains.kotlinx:kotlin-deeplearning-dataset:0.5.1")

    implementation("space.kscience:plotlykt-core:0.5.0")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.0-Beta")
}

tasks.named<Test>("test") {
    // Use JUnit Platform for unit tests.
    useJUnitPlatform()
}
