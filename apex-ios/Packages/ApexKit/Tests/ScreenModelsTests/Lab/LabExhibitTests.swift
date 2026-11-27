#if DEBUG
    import ScreenModels
    import Testing

    struct LabExhibitTests {
        @Test func anExhibitsStateNameIsLabThenItsName() {
            #expect(LabExhibit.motion.stateName == "lab.motion")
        }

        @Test func anExhibitIsFoundByItsStateName() {
            #expect(LabExhibit.allCases.allSatisfy { LabExhibit(stateName: $0.stateName) == $0 })
        }

        @Test func anyOtherNameIsNoExhibit() {
            let found = ["lab.nope", "lab", "motion", "home.noProgram"].compactMap(LabExhibit.init(stateName:))

            #expect(found == [])
        }
    }
#endif
