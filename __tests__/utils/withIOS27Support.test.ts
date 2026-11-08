/**
 * The iOS 27 SDK refuses to launch apps without the UIScene lifecycle, and rejects
 * pods whose deployment target is below 15. These transforms patch Expo's prebuild
 * output so a fresh `expo prebuild` still produces an app that builds and launches.
 */

const {
  addSceneDelegate,
  addSceneManifest,
  raisePodDeploymentTargets,
} = require('../../plugins/withIOS27Support');

// Expo SDK 54 prebuild output (AppDelegate.swift), trimmed to the parts the transform touches.
const APP_DELEGATE = `import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
}
`;

const PODFILE = `  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
  end
end
`;

describe('addSceneDelegate', () => {
  const out = addSceneDelegate(APP_DELEGATE);

  it('stops creating the window at launch', () => {
    expect(out).not.toContain('UIWindow(frame: UIScreen.main.bounds)');
    expect(out).toContain('return super.application(application, didFinishLaunchingWithOptions: launchOptions)');
  });

  it('starts React Native from a scene delegate', () => {
    expect(out).toContain('class SceneDelegate: UIResponder, UIWindowSceneDelegate');
    expect(out).toContain('UIWindow(windowScene: windowScene)');
    expect(out).toContain('reactNativeFactory?.startReactNative(withModuleName: "main", in: window, launchOptions: nil)');
  });

  it('forwards deep links and universal links to the app delegate', () => {
    expect(out).toContain('openURLContexts');
    expect(out).toContain('continue userActivity: NSUserActivity');
  });

  it('is idempotent', () => {
    expect(addSceneDelegate(out)).toBe(out);
  });

  it('fails loudly when the template changes shape', () => {
    expect(() => addSceneDelegate('public class AppDelegate {}')).toThrow(/withIOS27Support/);
  });
});

describe('addSceneManifest', () => {
  it('declares a single scene backed by SceneDelegate', () => {
    expect(addSceneManifest({ CFBundleName: 'APEX' })).toEqual({
      CFBundleName: 'APEX',
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
    });
  });
});

describe('raisePodDeploymentTargets', () => {
  const out = raisePodDeploymentTargets(PODFILE);

  it('raises pods below iOS 15 inside post_install, after the React Native hook', () => {
    expect(out).toContain("c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'");
    expect(out.indexOf('react_native_post_install')).toBeLessThan(out.indexOf('IPHONEOS_DEPLOYMENT_TARGET'));
    expect(out.trimEnd().endsWith('end\nend')).toBe(true);
  });

  it('is idempotent', () => {
    expect(raisePodDeploymentTargets(out)).toBe(out);
  });

  it('fails loudly when the Podfile changes shape', () => {
    expect(() => raisePodDeploymentTargets('target "APEX" do\nend\n')).toThrow(/withIOS27Support/);
  });
});
