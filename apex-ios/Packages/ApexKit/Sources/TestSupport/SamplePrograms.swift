import Training

extension Program {
    /// The mock's six sample programs, as `design/export/app/library.dc.html` draws them. Every number is the
    /// demo's sample content; the app's own programs are `Program.builtIn`.
    public static let samples: [Program] = [
        Program(
            id: "pillars",
            name: "Pillars",
            goal: "Strength",
            level: "Intermediate",
            line: "Get stronger on the big four, with size along the way.",
            blocks: [
                Block("Hypertrophy", weeks: 5, deloadLast: true),
                Block("Strength", weeks: 4, deloadLast: true),
                Block("Peak", weeks: 2),
            ],
            daysAWeek: 5
        ),
        Program(
            id: "anchor",
            name: "Anchor",
            goal: "Strength",
            level: "Intermediate",
            line: "A short strength block around squat, bench and deadlift.",
            blocks: [Block("Volume", weeks: 3), Block("Strength", weeks: 2), Block("Test", weeks: 1)],
            daysAWeek: 4
        ),
        Program(
            id: "summit",
            name: "Summit",
            goal: "Strength",
            level: "Advanced",
            line: "Builds to a heavy single on each main lift.",
            blocks: [
                Block("Base", weeks: 4, deloadLast: true),
                Block("Build", weeks: 4, deloadLast: true),
                Block("Peak", weeks: 3),
                Block("Test", weeks: 1),
            ],
            daysAWeek: 4
        ),
        Program(
            id: "foundations",
            name: "Foundations",
            goal: "General",
            level: "Beginner",
            line: "Learn the main lifts, three full-body days a week.",
            blocks: [Block("Learn", weeks: 4), Block("Build", weeks: 4, deloadLast: true)],
            daysAWeek: 3
        ),
        Program(
            id: "rebuild",
            name: "Rebuild",
            goal: "General",
            level: "All levels",
            line: "Ease back in after time off.",
            blocks: [Block("Rebuild", weeks: 4)],
            daysAWeek: 3
        ),
        Program(
            id: "engine",
            name: "Engine",
            goal: "Hybrid",
            level: "All levels",
            line: "Two lifting days and two runs a week.",
            blocks: [Block("Base", weeks: 4, deloadLast: true), Block("Build", weeks: 4)],
            daysAWeek: 4
        ),
    ]
}
