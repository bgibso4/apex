import Core
import OSLog
import Observation
import Training

/// Programs' model (the Library): every built-in program as a card, the active one alone under "Active".
/// Design: APEX README, "Lists, search, filters" › Programs; overview-decisions, Library turns 1 to 4.
@Observable public final class ProgramsModel {
    public private(set) var sections: [ProgramsSection] = []

    private let programs: [Program]
    private let currentRun: () throws -> ProgramRun?
    private let today: () -> Day
    private let logger = Logger(subsystem: "com.cadre.apex", category: "ScreenModels")

    /// `currentRun` reads the run the app is on from the store; `today` is the day it is now.
    public init(programs: [Program], currentRun: @escaping () throws -> ProgramRun?, today: @escaping () -> Day) {
        self.programs = programs
        self.currentRun = currentRun
        self.today = today
        refresh()
    }

    /// Reads the run and the day again. The screen calls it each time it appears: the day changes under an app
    /// left open, and the run changes when a program is started.
    public func refresh() {
        do {
            sections = makeSections(run: try currentRun())
        } catch {
            logger.error("The current run could not be read: \(error)")
            // Nothing shown yet: the programs with none active. Otherwise what was shown stays.
            if sections.isEmpty { sections = makeSections(run: nil) }
        }
    }

    private func makeSections(run: ProgramRun?) -> [ProgramsSection] {
        let today = today()
        guard let run, let active = programs.first(where: { $0.id == run.programID }) else {
            if let run {
                logger.error("The current run's program is not built in: \(run.programID, privacy: .public)")
            }
            return [ProgramsSection(label: nil, cards: programs.map { ProgramCard($0, today: today) })]
        }
        let others = programs.filter { $0.id != active.id }.map { ProgramCard($0, today: today) }
        let activeSection = ProgramsSection(label: "Active", cards: [ProgramCard(active, run: run, today: today)])
        return others.isEmpty
            ? [activeSection] : [activeSection, ProgramsSection(label: "All programs", cards: others)]
    }
}
