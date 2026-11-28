import Core
import ScreenModels
import Store
import Training

// What a designed state is built from. A fixture that cannot be made is a mistake in this file, so it stops with
// a message: no state is ever shown on something else instead.

extension Day {
    static func fixture(_ iso: String) -> Day {
        guard let day = Day(iso: iso) else { fatalError("The fixture day \(iso) is not a day") }
        return day
    }
}

extension ProgramsModel {
    /// Programs over the mock's sample programs, with `run` as the current run, read back from a database of the
    /// state's own in memory, on `today`.
    @MainActor static func samples(run: ProgramRun? = nil, today: Day) -> ProgramsModel {
        do {
            let store = try Store(.inMemory)
            if let run { try store.startRun(of: run.programID, on: run.startedOn) }
            return ProgramsModel(programs: Program.samples, currentRun: store.currentRun) { today }
        } catch {
            fatalError("The fixture store could not be made: \(error)")
        }
    }
}
