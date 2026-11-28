/// What the store reports beyond SQLite's own errors.
public enum StoreError: Error, Equatable {
    /// A newer build has migrated this database. An older build never writes to it.
    case newerSchema
    /// A column that holds a day holds this instead.
    case notADay(String)
}
