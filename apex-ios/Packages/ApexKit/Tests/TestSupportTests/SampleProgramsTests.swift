import TestSupport
import Testing
import Training

/// The mock's sample programs, as `design/export/app/library.dc.html` draws them.
struct SampleProgramsTests {
    @Test func theyAreTheMocksSixInItsOrder() {
        #expect(Program.samples.map(\.name) == ["Pillars", "Anchor", "Summit", "Foundations", "Rebuild", "Engine"])
        #expect(Program.samples.map(\.weekCount) == [11, 6, 12, 8, 4, 8])
        #expect(Program.samples.map(\.daysAWeek) == [5, 4, 4, 3, 3, 4])
        #expect(Set(Program.samples.map(\.id)).count == 6)
    }
}
