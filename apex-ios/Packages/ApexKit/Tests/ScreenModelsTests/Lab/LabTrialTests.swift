#if DEBUG
    import ScreenModels
    import Testing

    struct LabTrialTests {
        @Test func aTrialStartsOnTheTokensValue() {
            #expect(LabTrial(token: 0.15, candidates: [0, 0.15, 0.3]).tried == 0.15)
        }

        @Test func theOptionsAreInOrderWithNoRepeats() {
            #expect(LabTrial(token: 0.15, candidates: [0.3, 0, 0.15, 0.3]).options == [0, 0.15, 0.3])
        }

        @Test func aTokenValueNobodyListedIsStillOffered() {
            let trial = LabTrial.snappyBounce(token: 0.12)

            #expect(trial.options == [0, 0.1, 0.12, 0.15, 0.2, 0.3, 0.4, 0.5])
            #expect(trial.tried == 0.12)
        }

        /// Issue 93's five values, and two more that reach the demo's pop (see `snappyBounce`).
        @Test func theSnappyBounceTrialOffersTheIssuesValuesAndTwoBouncier() {
            #expect(LabTrial.snappyBounce(token: 0.15).options == [0, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5])
        }
    }
#endif
