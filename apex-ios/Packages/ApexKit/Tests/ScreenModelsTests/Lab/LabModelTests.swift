#if DEBUG
    import ScreenModels
    import TestSupport
    import Testing

    struct LabModelTests {
        @Test func theLabStartsClosedAtItsList() {
            let lab = LabModel()

            #expect(!lab.isOpen)
            #expect(lab.path == [])
        }

        @Test func openingAtAnExhibitShowsItOverTheList() {
            let lab = LabModel()

            lab.open(at: .motion)

            #expect(lab.isOpen)
            #expect(lab.path == [.motion])
        }

        @Test func theAppsLabStartsClosed() {
            #expect(!DesignedState.homeNoProgram.appModel().lab.isOpen)
        }
    }
#endif
