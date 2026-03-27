const { withEntitlementsPlist } = require('@expo/config-plugins');

function withICloudBackup(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    mod.modResults['com.apple.developer.icloud-container-identifiers'] = [
      'iCloud.com.bgibso4.apex',
    ];
    mod.modResults['com.apple.developer.ubiquity-container-identifiers'] = [
      'iCloud.com.bgibso4.apex',
    ];
    return mod;
  });
}

module.exports = withICloudBackup;
