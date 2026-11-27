import XCTest

extension XCUIElement {
    /// True once `format` holds for this element, within `timeout` seconds of the call (see `holds`).
    func satisfies(_ format: String, within timeout: TimeInterval) -> Bool {
        holds(NSPredicate(format: format), for: self, within: timeout)
    }

    /// `waitForExistence`, without its idle first second.
    func appears(within timeout: TimeInterval) -> Bool {
        satisfies("exists == true", within: timeout)
    }

    /// `waitForNonExistence`, without its idle first second.
    func disappears(within timeout: TimeInterval) -> Bool {
        satisfies("exists == false", within: timeout)
    }
}

/// How long a wait rests between two checks. Filing-cabinet measured this: at 0.1 s a wait returned in the middle
/// of a transition and the next step ran into it.
private let checkPause: TimeInterval = 1

/// True once `predicate` holds for `object`, in a check that started within `timeout` seconds of the call.
///
/// XCTest's own waits first check about 1 s after they start, even when the element is already there, and a check
/// still running at the deadline counts as a timeout whatever it read. This checks right away and then again and
/// again; the deadline decides whether another check starts, not whether a started one counts. A wait can so run
/// over `timeout` by one check.
private func holds(_ predicate: NSPredicate, for object: Any, within timeout: TimeInterval) -> Bool {
    let deadline = Date.now.addingTimeInterval(timeout)
    repeat {
        if predicate.evaluate(with: object) { return true }
        RunLoop.current.run(until: Date.now.addingTimeInterval(checkPause))
    } while Date.now < deadline
    return false
}
