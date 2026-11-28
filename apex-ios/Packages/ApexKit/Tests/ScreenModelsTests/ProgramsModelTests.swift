import Core
import ScreenModels
import Store
import TestSupport
import Testing
import Training

struct ProgramsModelTests {
    private struct ReadFailed: Error {}

    private let store: Store
    private let pillars: Program

    init() throws {
        store = try Store(.inMemory)
        pillars = try #require(Program.samples.first)
    }

    @Test func withNoRunThereAreNoLabels() throws {
        let sections = try model(today: "2026-08-20").sections

        #expect(sections.map(\.label) == [nil])
        #expect(sections.first?.cards.map(\.name) == Program.samples.map(\.name))
        let cards = try #require(sections.first?.cards)
        #expect(cards.allSatisfy { $0.tag == nil })
        #expect(cards.flatMap(\.blocks).flatMap(\.bars).allSatisfy { $0.fill == .plain })
    }

    @Test func theActiveProgramSitsAloneUnderActive() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))

        let sections = try model(today: "2026-08-20").sections

        #expect(sections.map(\.label) == ["Active", "All programs"])
        #expect(
            sections.map { $0.cards.map(\.name) } == [
                ["Pillars"], ["Anchor", "Summit", "Foundations", "Rebuild", "Engine"],
            ])
    }

    @Test func theActiveCardShowsItsWeek() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))

        let card = try activeCard(today: "2026-08-20")

        #expect(card.tag == "Week 3 of 11")
        #expect(card.blocks.map(\.name) == ["Hypertrophy", "Strength", "Peak"])
        #expect(card.blocks.map(\.bars.count) == [5, 4, 2])
        let bars = card.blocks.flatMap(\.bars)
        #expect(bars.map(\.fill) == [.done, .done, .current] + Array(repeating: .upcoming, count: 8))
        #expect(bars.map(\.isDeload) == [4, 8].reduce(into: Array(repeating: false, count: 11)) { $0[$1] = true })
    }

    @Test func aCardSaysWhatTheProgramIs() throws {
        let cards = try #require(try model(today: "2026-08-20").sections.first?.cards)
        let summit = try #require(cards.first { $0.name == "Summit" })

        #expect(summit.eyebrow == "Strength · Advanced")
        #expect(summit.line == "Builds to a heavy single on each main lift.")
        #expect(summit.stats == [Stat(value: "12", label: "Weeks"), Stat(value: "4", label: "Days a week")])
    }

    @Test func theOtherProgramsAreNotMarkedWhileOneIsActive() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))

        let others = try #require(try model(today: "2026-08-20").sections.last?.cards)

        #expect(others.allSatisfy { $0.tag == nil })
        #expect(others.flatMap(\.blocks).flatMap(\.bars).allSatisfy { $0.fill == .plain })
    }

    @Test func beforeItsFirstDayARunHasNoWeek() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))

        let card = try activeCard(today: "2026-08-02")

        #expect(card.tag == nil)
        #expect(card.blocks.flatMap(\.bars).allSatisfy { $0.fill == .upcoming })
    }

    @Test func afterItsLastWeekARunHasNoWeek() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))

        let card = try activeCard(today: "2026-10-19")

        #expect(card.tag == nil)
        #expect(card.blocks.flatMap(\.bars).allSatisfy { $0.fill == .done })
    }

    @Test func aRunOfAProgramThatIsGoneShowsNoActive() throws {
        try store.startRun(of: "retired", on: try day("2026-08-03"))

        let sections = try model(today: "2026-08-20").sections

        #expect(sections.map(\.label) == [nil])
        #expect(sections.first?.cards.count == 6)
    }

    @Test func refreshFollowsTheDay() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))
        var today = try day("2026-08-09")
        let model = ProgramsModel(programs: Program.samples, currentRun: store.currentRun) { today }
        #expect(model.sections.first?.cards.first?.tag == "Week 1 of 11")

        today = try day("2026-08-10")
        model.refresh()

        #expect(model.sections.first?.cards.first?.tag == "Week 2 of 11")
    }

    @Test func refreshFollowsTheStore() throws {
        let model = try model(today: "2026-08-20")

        try store.startRun(of: pillars.id, on: try day("2026-08-03"))
        model.refresh()

        #expect(model.sections.map(\.label) == ["Active", "All programs"])
    }

    @Test func theOnlyProgramBeingActiveLeavesNoAllPrograms() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))
        let today = try day("2026-08-20")

        let model = ProgramsModel(programs: [pillars], currentRun: store.currentRun) { today }

        #expect(model.sections.map(\.label) == ["Active"])
    }

    @Test func aRunThatCannotBeReadShowsTheProgramsWithNoActive() throws {
        let today = try day("2026-08-20")

        let model = ProgramsModel(programs: Program.samples, currentRun: { throw ReadFailed() }, today: { today })

        #expect(model.sections.map(\.label) == [nil])
        #expect(model.sections.first?.cards.count == 6)
    }

    @Test func aReadThatFailsLaterKeepsWhatWasShown() throws {
        try store.startRun(of: pillars.id, on: try day("2026-08-03"))
        let today = try day("2026-08-20")
        var fails = false
        let model = ProgramsModel(
            programs: Program.samples,
            currentRun: { [store] in
                if fails { throw ReadFailed() }
                return try store.currentRun()
            },
            today: { today }
        )

        fails = true
        model.refresh()

        #expect(model.sections.map(\.label) == ["Active", "All programs"])
    }

    private func model(today: String) throws -> ProgramsModel {
        let today = try day(today)
        return ProgramsModel(programs: Program.samples, currentRun: store.currentRun) { today }
    }

    private func activeCard(today: String) throws -> ProgramCard {
        let sections = try model(today: today).sections
        #expect(sections.first?.label == "Active")
        return try #require(sections.first?.cards.first)
    }

    private func day(_ iso: String) throws -> Day {
        try #require(Day(iso: iso))
    }
}
