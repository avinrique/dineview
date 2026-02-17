import * as THREE from 'three';

export interface ArSessionConfig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  onSessionStarted?: () => void;
  onSessionEnded?: () => void;
  onHitTestResult?: (hitMatrix: Float32Array) => void;
}

export class ArSession {
  private xrSession: XRSession | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private config: ArSessionConfig;

  constructor(config: ArSessionConfig) {
    this.config = config;
  }

  async start(): Promise<boolean> {
    try {
      if (!navigator.xr) return false;

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
        optionalFeatures: ['dom-overlay'],
      });

      this.xrSession = session;
      this.config.renderer.xr.enabled = true;
      await this.config.renderer.xr.setSession(session);

      this.referenceSpace = await session.requestReferenceSpace('local-floor');

      // Set up hit testing
      const viewerSpace = await session.requestReferenceSpace('viewer');
      this.hitTestSource = (await session.requestHitTestSource!({
        space: viewerSpace,
      })) ?? null;

      session.addEventListener('end', () => {
        this.cleanup();
        this.config.onSessionEnded?.();
      });

      this.config.onSessionStarted?.();
      return true;
    } catch (error) {
      console.error('Failed to start AR session:', error);
      return false;
    }
  }

  processHitTest(frame: XRFrame) {
    if (!this.hitTestSource || !this.referenceSpace) return null;

    const hitTestResults = frame.getHitTestResults(this.hitTestSource);
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(this.referenceSpace);
      if (pose) {
        return pose.transform.matrix;
      }
    }
    return null;
  }

  async end() {
    if (this.xrSession) {
      await this.xrSession.end();
    }
  }

  private cleanup() {
    this.hitTestSource = null;
    this.referenceSpace = null;
    this.xrSession = null;
    this.config.renderer.xr.enabled = false;
  }

  get isActive(): boolean {
    return this.xrSession !== null;
  }
}
