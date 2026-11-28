/// Sharing a length between parts by weight, where no part may fall under its own minimum.
public enum Proportion {
    /// `total` split in proportion to `weights`, one share per weight. A part whose share would be under its
    /// minimum gets the minimum, and the others share what is left. Minimums that do not fit in `total` shrink
    /// together. `minimums` has one value per weight.
    public static func shares(of total: Double, weights: [Double], minimums: [Double]) -> [Double] {
        guard total > 0 else { return weights.map { _ in 0 } }
        let minimumSum = minimums.reduce(0, +)
        if minimumSum >= total { return minimums.map { $0 / minimumSum * total } }

        // Parts leave `free` as they are held at their minimum. The last free part gets all that is left, which
        // is over its minimum because the minimums fit, so the loop ends with a part still free.
        var shares = minimums
        var free = Set(weights.indices)
        while true {
            let left = total - weights.indices.filter { !free.contains($0) }.reduce(0) { $0 + minimums[$1] }
            let weightSum = free.reduce(0) { $0 + weights[$1] }
            func share(_ index: Int) -> Double {
                weightSum > 0 ? left * weights[index] / weightSum : left / Double(free.count)
            }
            let under = free.filter { share($0) < minimums[$0] }
            if under.isEmpty {
                for index in free { shares[index] = share(index) }
                return shares
            }
            free.subtract(under)
        }
    }
}
