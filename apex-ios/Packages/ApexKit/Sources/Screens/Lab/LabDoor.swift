#if DEBUG
    import ScreenModels
    import SwiftUI

    /// The way into the lab by hand: press and hold. It shows nothing, so the screen it sits on keeps its picture.
    private struct LabDoor: ViewModifier {
        /// Nil where no root put a lab in the environment, such as a preview of one screen: the press does nothing.
        @Environment(LabModel.self) private var lab: LabModel?

        func body(content: Content) -> some View {
            content.onLongPressGesture { lab?.isOpen = true }
        }
    }

    extension View {
        /// On the app's root: shows the lab over the app while it is open, and hands its model to `opensLab`.
        func labSheet(_ lab: LabModel) -> some View {
            @Bindable var lab = lab
            return sheet(isPresented: $lab.isOpen) { LabScreen(model: lab) }
                .environment(lab)
        }

        /// Opens the lab when the view is pressed and held. Home's wordmark carries it.
        func opensLab() -> some View {
            modifier(LabDoor())
        }
    }
#endif
