/**
 * Patches Expo SDK 54 prebuild output so the app builds and launches on the iOS 27 SDK:
 * - UIScene lifecycle is mandatory (apps without a scene delegate crash at launch), so the
 *   window and React Native start move from AppDelegate into a SceneDelegate.
 * - Pods targeting iOS < 15 are a hard error (react-native-svg declares 12.4).
 * Drop this plugin once Expo's template ships scene support.
 */
const { withAppDelegate, withInfoPlist, withPodfile } = require('@expo/config-plugins');

const TAG = 'withIOS27Support';

const LAUNCH_WINDOW_BLOCK = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;

const SCENE_DELEGATE = `class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    appDelegate.reactNativeFactory?.startReactNative(withModuleName: "main", in: window, launchOptions: nil)
    if let url = connectionOptions.urlContexts.first?.url { openURL(url) }
    if let activity = connectionOptions.userActivities.first { continueActivity(activity) }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url { openURL(url) }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    continueActivity(userActivity)
  }

  // Route through the app delegate so Expo subscribers and RCTLinkingManager still see links.
  private func openURL(_ url: URL) {
    _ = UIApplication.shared.delegate?.application?(UIApplication.shared, open: url, options: [:])
  }

  private func continueActivity(_ activity: NSUserActivity) {
    _ = UIApplication.shared.delegate?.application?(UIApplication.shared, continue: activity, restorationHandler: { _ in })
  }
}

`;

const POD_TARGET_BUMP = `    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |c|
        if c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.0
          c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        end
      end
    end
`;

function fail(what) {
  throw new Error(`[${TAG}] ${what} not found — the Expo template changed; update this plugin.`);
}

function addSceneDelegate(src) {
  if (src.includes('class SceneDelegate')) return src;
  const anchor = 'class ReactNativeDelegate';
  if (!src.includes(LAUNCH_WINDOW_BLOCK)) fail('AppDelegate launch window block');
  if (!src.includes(anchor)) fail('ReactNativeDelegate class');
  return src.replace(LAUNCH_WINDOW_BLOCK, '').replace(anchor, SCENE_DELEGATE + anchor);
}

function addSceneManifest(plist) {
  return {
    ...plist,
    UIApplicationSceneManifest: {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    },
  };
}

function raisePodDeploymentTargets(podfile) {
  if (podfile.includes(POD_TARGET_BUMP)) return podfile;
  const hookEnd = /(\n {4}react_native_post_install\([\s\S]*?\n {4}\)\n)/;
  if (!hookEnd.test(podfile)) fail('react_native_post_install call');
  return podfile.replace(hookEnd, `$1${POD_TARGET_BUMP}`);
}

function withIOS27Support(config) {
  config = withAppDelegate(config, (mod) => {
    mod.modResults.contents = addSceneDelegate(mod.modResults.contents);
    return mod;
  });
  config = withInfoPlist(config, (mod) => {
    mod.modResults = addSceneManifest(mod.modResults);
    return mod;
  });
  return withPodfile(config, (mod) => {
    mod.modResults.contents = raisePodDeploymentTargets(mod.modResults.contents);
    return mod;
  });
}

module.exports = withIOS27Support;
module.exports.addSceneDelegate = addSceneDelegate;
module.exports.addSceneManifest = addSceneManifest;
module.exports.raisePodDeploymentTargets = raisePodDeploymentTargets;
