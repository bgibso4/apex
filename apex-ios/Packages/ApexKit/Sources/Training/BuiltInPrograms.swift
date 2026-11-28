extension Program {
    /// The programs that come with the app: Ben's own, from the React Native app's definitions
    /// (`apex-rn/src/data/*.json`), in the order they were written. The ids are those definitions' ids.
    /// Goal, level and the line are new with the Library (overview-decisions, Library turns 2 and 3).
    public static let builtIn: [Program] = [
        Program(
            id: "functional-athlete",
            name: "Functional Athlete",
            goal: "Hybrid",
            level: "Intermediate",
            line: "Strength, power and conditioning, six days a week.",
            blocks: functionalAthleteBlocks,
            daysAWeek: 6
        ),
        Program(
            id: "functional-athlete-pillars",
            name: "Pillars",
            goal: "Hybrid",
            level: "Intermediate",
            line: "Functional Athlete with more for hips, core and back.",
            blocks: functionalAthleteBlocks,
            daysAWeek: 6
        ),
        Program(
            id: "pillars-hypertrophy",
            name: "Pillars Hypertrophy",
            goal: "Hypertrophy",
            level: "Intermediate",
            line: "Six weeks of Pillars' hypertrophy block, no deload.",
            blocks: [Block("Hypertrophy", weeks: 6)],
            daysAWeek: 6
        ),
    ]

    /// Functional Athlete and Pillars share their weeks: Hypertrophy 1 to 4 and a deload, Strength 6 to 9 and a
    /// deload, then one week of Realization.
    private static let functionalAthleteBlocks = [
        Block("Hypertrophy", weeks: 5, deloadLast: true),
        Block("Strength", weeks: 5, deloadLast: true),
        Block("Realization", weeks: 1),
    ]
}
