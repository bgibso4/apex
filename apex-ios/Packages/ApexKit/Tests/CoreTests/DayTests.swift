import Core
import Foundation
import Testing

struct DayTests {
    @Test func theDayIsTheCalendarsNotGMTs() throws {
        let gmt = try calendar(in: "GMT")
        let instant = try #require(gmt.date(from: DateComponents(year: 2026, month: 8, day: 21, hour: 2)))

        #expect(Day(instant, in: try #require(TimeZone(identifier: "America/Toronto"))).iso == "2026-08-20")
        #expect(Day(instant, in: .gmt).iso == "2026-08-21")
    }

    @Test func aZoneAheadOfGMTIsAlreadyOnTheNextDay() throws {
        let gmt = try calendar(in: "GMT")
        let instant = try #require(gmt.date(from: DateComponents(year: 2026, month: 12, day: 31, hour: 20)))

        #expect(Day(instant, in: try #require(TimeZone(identifier: "Asia/Tokyo"))).iso == "2027-01-01")
    }

    @Test func isoRoundTrips() {
        #expect(Day(iso: "2026-08-03")?.iso == "2026-08-03")
    }

    @Test(arguments: [
        "", "2026-13-45", "2026-02-30", "2026-8-3", "20260803", "2026-08-03T00:00:00Z", " 2026-08-03", "2026-08-0３",
    ])
    func whatIsNotADayIsNil(text: String) {
        #expect(Day(iso: text) == nil)
    }

    @Test func daysBetween() throws {
        #expect(try day("2026-08-20").days(since: try day("2026-08-03")) == 17)
        #expect(try day("2026-08-03").days(since: try day("2026-08-20")) == -17)
        #expect(try day("2026-03-01").days(since: try day("2026-02-28")) == 1)
        // Across the night the clocks go back in North America: still two days.
        #expect(try day("2026-11-02").days(since: try day("2026-10-31")) == 2)
    }

    @Test func daysAreOrdered() throws {
        #expect(try day("2026-08-03") < day("2026-08-20"))
        #expect(try day("2025-12-31") < day("2026-01-01"))
        #expect(try !(day("2026-08-20") < day("2026-08-20")))
    }

    private func day(_ iso: String) throws -> Day {
        try #require(Day(iso: iso))
    }

    private func calendar(in zone: String) throws -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = try #require(TimeZone(identifier: zone))
        return calendar
    }
}
