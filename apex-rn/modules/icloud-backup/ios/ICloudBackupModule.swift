import ExpoModulesCore
import Foundation

public class ICloudBackupModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudBackup")

    AsyncFunction("copyToICloud") { (sourcePath: String, filename: String) -> Bool in
      guard let containerURL = FileManager.default.url(
        forUbiquityContainerIdentifier: "iCloud.com.bgibso4.apex"
      ) else {
        return false
      }

      let documentsURL = containerURL.appendingPathComponent("Documents")
      let destinationURL = documentsURL.appendingPathComponent(filename)

      do {
        // Create Documents directory if needed
        try FileManager.default.createDirectory(
          at: documentsURL,
          withIntermediateDirectories: true,
          attributes: nil
        )

        // Remove existing file if present
        if FileManager.default.fileExists(atPath: destinationURL.path) {
          try FileManager.default.removeItem(at: destinationURL)
        }

        // Copy the database file
        try FileManager.default.copyItem(
          at: URL(fileURLWithPath: sourcePath),
          to: destinationURL
        )

        return true
      } catch {
        return false
      }
    }
  }
}
