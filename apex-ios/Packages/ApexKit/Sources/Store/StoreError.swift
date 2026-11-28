/// What the store reports beyond SQLite's own errors. The app only logs an error from the store, so no case is
/// public yet.
package enum StoreError: Error, Equatable {
    /// A newer build has migrated this database. An older build never writes to it.
    case newerSchema
    /// A column that holds a day holds this instead.
    case notADay(String)
}
