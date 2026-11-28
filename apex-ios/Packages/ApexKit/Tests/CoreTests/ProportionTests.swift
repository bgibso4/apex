import Core
import Testing

struct ProportionTests {
    @Test func widthsFollowTheWeights() {
        #expect(Proportion.shares(of: 110, weights: [5, 4, 2], minimums: [0, 0, 0]) == [50, 40, 20])
    }

    @Test func aShareIsNeverUnderItsMinimum() {
        #expect(Proportion.shares(of: 100, weights: [1, 1], minimums: [70, 0]) == [70, 30])
    }

    @Test func theOthersShareWhatAMinimumLeaves() {
        #expect(Proportion.shares(of: 100, weights: [1, 1, 2], minimums: [40, 0, 0]) == [40, 20, 40])
    }

    @Test func raisingOneCanPutAnotherUnderItsMinimum() {
        #expect(Proportion.shares(of: 100, weights: [1, 1, 2], minimums: [40, 25, 0]) == [40, 25, 35])
    }

    @Test func minimumsThatDoNotFitShrinkTogether() {
        #expect(Proportion.shares(of: 60, weights: [1, 1], minimums: [40, 40]) == [30, 30])
        #expect(Proportion.shares(of: 60, weights: [3, 1], minimums: [60, 20]) == [45, 15])
    }

    @Test func nothingToShare() {
        #expect(Proportion.shares(of: 100, weights: [], minimums: []) == [])
        #expect(Proportion.shares(of: 0, weights: [1, 2], minimums: [0, 0]) == [0, 0])
        #expect(Proportion.shares(of: -5, weights: [1, 2], minimums: [10, 0]) == [0, 0])
    }

    @Test func weightsOfNothingShareEqually() {
        #expect(Proportion.shares(of: 100, weights: [0, 0], minimums: [0, 0]) == [50, 50])
    }

    @Test(arguments: [320.0, 97.5, 12])
    func theSharesAddUpToTheWhole(total: Double) {
        let shares = Proportion.shares(of: total, weights: [5, 5, 1], minimums: [80, 60, 85])

        #expect(abs(shares.reduce(0, +) - total) < 0.000_001)
    }
}
