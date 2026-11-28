import Testing
import Training

struct BuiltInProgramsTests {
    private let programs = Program.builtIn

    @Test func theyAreBensThreeInOrder() {
        #expect(programs.map(\.id) == ["functional-athlete", "functional-athlete-pillars", "pillars-hypertrophy"])
        #expect(programs.map(\.name) == ["Functional Athlete", "Pillars", "Pillars Hypertrophy"])
    }

    @Test func theirLengthsAreTheOldDefinitions() {
        #expect(programs.map(\.weekCount) == [11, 11, 6])
        #expect(programs.map(\.daysAWeek) == [6, 6, 6])
    }

    @Test func aDeloadIsAWeekInsideTheBlockBeforeIt() throws {
        let pillars = try #require(programs.first { $0.id == "functional-athlete-pillars" })

        #expect(pillars.blocks.map(\.name) == ["Hypertrophy", "Strength", "Realization"])
        #expect(pillars.blocks.map(\.weeks.count) == [5, 5, 1])
        let deloadWeeks = pillars.blocks.flatMap(\.weeks).enumerated().filter(\.element.isDeload).map { $0.offset + 1 }
        #expect(deloadWeeks == [5, 10])
    }

    @Test func pillarsHypertrophyHasNoDeload() throws {
        let program = try #require(programs.first { $0.id == "pillars-hypertrophy" })

        #expect(program.blocks.map(\.name) == ["Hypertrophy"])
        #expect(program.blocks.flatMap(\.weeks).map(\.isDeload) == Array(repeating: false, count: 6))
    }

    @Test func everyCardFieldIsWrittenAndHasNoEmDash() {
        for program in programs {
            for text in [program.name, program.goal, program.level, program.line] + program.blocks.map(\.name) {
                #expect(!text.isEmpty, "\(program.id)")
                #expect(!text.contains("—"), "\(program.id): \(text)")
            }
        }
    }

    @Test func aBlockBuiltByCountEndsInItsDeload() {
        #expect(Program.Block("Base", weeks: 4, deloadLast: true).weeks.map(\.isDeload) == [false, false, false, true])
        #expect(Program.Block("Test", weeks: 1).weeks.map(\.isDeload) == [false])
    }
}
