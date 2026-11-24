import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNativeApp = () => Capacitor.isNativePlatform();

// Runs only inside the Capacitor shell. Each call is guarded because the
// plugins do nothing on the web and must never block startup.
export async function initNativeShell() {
  if (!isNativeApp()) return;

  try {
    // The app renders on a light background, so the bar needs dark icons.
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // Cosmetic only.
  }

  try {
    // Wait for React's first paint, then reveal it under the splash.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await SplashScreen.hide();
  } catch {
    // Config sets launchAutoHide as a fallback.
  }
}
