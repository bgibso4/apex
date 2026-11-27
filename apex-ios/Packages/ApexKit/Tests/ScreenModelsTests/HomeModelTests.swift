import Foundation
import ScreenModels
import Testing

struct HomeModelTests {
    @Test func theEyebrowNamesTheProgramThatEndedAndItsDay() throws {
        let gmt = try calendar(in: "GMT")
        let ended = EndedProgram(name: "Pillars", endedOn: try date(2026, 8, 20, hour: 12, in: gmt))

        #expect(HomeModel(lastEnded: ended, calendar: gmt).noProgramEyebrow == "Pillars ended Aug 20")
    }

    @Test func thereIsNoEyebrowWhenNoProgramHasEnded() throws {
        #expect(HomeModel(lastEnded: nil, calendar: try calendar(in: "GMT")).noProgramEyebrow == nil)
    }

    @Test func theDayIsTheCalendarsNotGMTs() throws {
        let ended = EndedProgram(name: "Pillars", endedOn: try date(2026, 8, 21, hour: 2, in: try calendar(in: "GMT")))
        let toronto = try calendar(in: "America/Toronto")

        #expect(HomeModel(lastEnded: ended, calendar: toronto).noProgramEyebrow == "Pillars ended Aug 20")
    }

    private func calendar(in zone: String) throws -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = try #require(TimeZone(identifier: zone))
        return calendar
    }

    private func date(_ year: Int, _ month: Int, _ day: Int, hour: Int, in calendar: Calendar) throws -> Date {
        try #require(calendar.date(from: DateComponents(year: year, month: month, day: day, hour: hour)))
    }
}
