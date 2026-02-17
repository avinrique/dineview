export interface ArSupportInfo {
  webXrSupported: boolean;
  immersiveArSupported: boolean;
  hitTestSupported: boolean;
}

export async function checkArSupport(): Promise<ArSupportInfo> {
  const result: ArSupportInfo = {
    webXrSupported: false,
    immersiveArSupported: false,
    hitTestSupported: false,
  };

  if (typeof navigator === 'undefined' || !('xr' in navigator)) {
    return result;
  }

  result.webXrSupported = true;

  try {
    const xr = navigator.xr;
    if (xr) {
      result.immersiveArSupported = await xr.isSessionSupported('immersive-ar');
      // Hit test support is checked during session request
      result.hitTestSupported = result.immersiveArSupported;
    }
  } catch {
    // WebXR not fully supported
  }

  return result;
}

export function isWebXRSupported(): boolean {
  return typeof navigator !== 'undefined' && 'xr' in navigator;
}
