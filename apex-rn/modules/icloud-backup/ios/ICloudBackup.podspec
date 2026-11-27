require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ICloudBackup'
  s.version        = package['version']
  s.summary        = 'iCloud Documents backup for APEX'
  s.description    = 'Copies SQLite database to iCloud Documents container'
  s.license        = 'MIT'
  s.author         = 'Ben Gibson'
  s.homepage       = 'https://github.com/bgibso4/apex'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/bgibso4/apex.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
